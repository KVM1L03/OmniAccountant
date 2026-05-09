"""
LLM-as-a-judge eval script for ReconciliationDecision verification.

Usage
-----
# Zero-cost dry-run (CI-safe, deterministic):
    EVAL_DRY_RUN=1 uv run python evals/llm_judge_evals.py

# Live run with Haiku (default, ~$0.001/run):
    uv run python evals/llm_judge_evals.py

# Live run with a different judge model:
    JUDGE_MODEL=claude-sonnet-4-6 uv run python evals/llm_judge_evals.py

Environment variables
---------------------
EVAL_DRY_RUN  Set to "1" to skip LLM calls and compute verdicts from
              business rules only.  Always correct for CI.
JUDGE_MODEL   litellm model string for the judge (default: claude-haiku-4-5-20251001).
"""

import asyncio
import json
import logging
import os
import sys
from typing import Literal

import litellm
from pydantic import BaseModel, ConfigDict, Field

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

DRY_RUN: bool = os.getenv("EVAL_DRY_RUN", "0") == "1"
JUDGE_MODEL: str = os.getenv("JUDGE_MODEL", "claude-haiku-4-5-20251001")

_JUDGE_SYSTEM = """\
You are a senior invoice reconciliation auditor reviewing an AI system's decisions.

Given: invoice ID, the amount stated on the invoice, the ERP expected amount,
the AI's decision, and its stated reason — determine whether the decision was correct.

Business rules:
  APPROVED       → correct only when |stated_amount - erp_expected| < 0.01
  DISCREPANCY    → correct when |stated_amount - erp_expected| >= 0.01
  HUMAN_REVIEW_NEEDED → always acceptable as a conservative fallback

Respond with a single JSON object:
{"correct": <bool>, "confidence": <float 0-1>, "critique": "<one sentence>"}
"""


class JudgeInput(BaseModel):
    model_config = ConfigDict(strict=True)

    invoice_id: str
    stated_amount: float
    erp_expected_amount: float
    model_decision: Literal["APPROVED", "DISCREPANCY", "HUMAN_REVIEW_NEEDED"]
    model_reason: str


class JudgeVerdict(BaseModel):
    model_config = ConfigDict(strict=True)

    correct: bool
    confidence: float = Field(ge=0.0, le=1.0)
    critique: str


def _dry_run_verdict(case: JudgeInput) -> JudgeVerdict:
    """Compute verdict from business rules — no LLM call, zero cost."""
    diff = abs(case.stated_amount - case.erp_expected_amount)
    correct = (
        (case.model_decision == "APPROVED" and diff < 0.01)
        or (case.model_decision == "DISCREPANCY" and diff >= 0.01)
        or case.model_decision == "HUMAN_REVIEW_NEEDED"
    )
    return JudgeVerdict(
        correct=correct,
        confidence=1.0,
        critique="Dry-run: verdict derived from business rules, no LLM call made.",
    )


async def judge_one(case: JudgeInput) -> tuple[JudgeInput, JudgeVerdict]:
    if DRY_RUN:
        return case, _dry_run_verdict(case)

    user_content = (
        f"Invoice ID: {case.invoice_id}\n"
        f"Stated amount: {case.stated_amount}\n"
        f"ERP expected: {case.erp_expected_amount}\n"
        f"Model decision: {case.model_decision}\n"
        f"Model reason: {case.model_reason}"
    )

    try:
        response = await litellm.acompletion(
            model=JUDGE_MODEL,
            messages=[
                {"role": "system", "content": _JUDGE_SYSTEM},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            max_tokens=256,
            num_retries=3,
        )
    except litellm.RateLimitError as exc:
        logger.error("Rate limit hit judging %s: %s", case.invoice_id, exc)
        raise
    except litellm.ServiceUnavailableError as exc:
        logger.error("LLM unavailable judging %s: %s", case.invoice_id, exc)
        raise

    raw: str = response.choices[0].message.content
    return case, JudgeVerdict.model_validate(json.loads(raw))


async def run_evals(cases: list[JudgeInput]) -> list[tuple[JudgeInput, JudgeVerdict]]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(judge_one(case)) for case in cases]
    return [t.result() for t in tasks]


# ---------------------------------------------------------------------------
# Eval fixtures
# ---------------------------------------------------------------------------

EVAL_CASES: list[JudgeInput] = [
    # ── Correct APPROVED ────────────────────────────────────────────────────
    JudgeInput(
        invoice_id="INV-2026-001",
        stated_amount=5425.00,
        erp_expected_amount=5425.00,
        model_decision="APPROVED",
        model_reason="Stated amount matches ERP expected exactly.",
    ),
    # ── Correct DISCREPANCY ─────────────────────────────────────────────────
    JudgeInput(
        invoice_id="INV-2026-004",
        stated_amount=16867.50,
        erp_expected_amount=16817.50,
        model_decision="DISCREPANCY",
        model_reason="Expected 16817.50, found 16867.50 — delta $50.00.",
    ),
    # ── Wrong decision: APPROVED on a $50 discrepancy (judge must flag) ─────
    JudgeInput(
        invoice_id="INV-2026-004",
        stated_amount=16867.50,
        erp_expected_amount=16817.50,
        model_decision="APPROVED",
        model_reason="Amounts look close enough.",
    ),
    # ── Conservative fallback is always acceptable ──────────────────────────
    JudgeInput(
        invoice_id="INV-2026-005",
        stated_amount=7540.74,
        erp_expected_amount=7540.75,
        model_decision="HUMAN_REVIEW_NEEDED",
        model_reason="Sub-cent difference — routing to human reviewer.",
    ),
]


def _report(results: list[tuple[JudgeInput, JudgeVerdict]]) -> int:
    failures = 0
    for case, verdict in results:
        icon = "PASS" if verdict.correct else "FAIL"
        logger.info(
            "[%s] %s | decision=%s | conf=%.2f | %s",
            icon,
            case.invoice_id,
            case.model_decision,
            verdict.confidence,
            verdict.critique,
        )
        if not verdict.correct:
            failures += 1
    return failures


def main() -> None:
    mode = "DRY-RUN" if DRY_RUN else f"LIVE ({JUDGE_MODEL})"
    logger.info(
        "LLM-as-judge evals starting [%s] — %d cases", mode, len(EVAL_CASES)
    )

    results = asyncio.run(run_evals(EVAL_CASES))
    failures = _report(results)

    if failures:
        logger.error("%d / %d case(s) judged incorrect.", failures, len(EVAL_CASES))
        sys.exit(1)

    logger.info("All %d cases passed.", len(results))


if __name__ == "__main__":
    main()
