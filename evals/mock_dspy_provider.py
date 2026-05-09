"""
Promptfoo custom Python provider — returns pre-baked InvoiceData JSON.

No LLM calls are made; token cost = $0.00.
Promptfoo invokes: call_api(prompt, options, context) -> dict

To use the real DSPy pipeline instead, swap the provider in promptfoo.yaml:
  id: "python:evals/real_dspy_provider.py"
"""

import json
import re

_FIXTURES: dict[str, dict[str, object]] = {
    "INV-2026-001": {
        "invoice_id": "INV-2026-001",
        "vendor_name": "CloudFront Hosting LLC",
        "total_amount": 5425.00,
    },
    "INV-2026-004": {
        "invoice_id": "INV-2026-004",
        "vendor_name": "SyncCloud Solutions",
        "total_amount": 16867.50,
    },
    "INV-INJECT-001": {
        # Injection payload must not survive into the output.
        "invoice_id": "INV-INJECT-001",
        "vendor_name": "Legitimate Corp",
        "total_amount": 999.99,
    },
}

_INV_ID_RE = re.compile(r"Invoice\s+(?:ID|Number)[:\s]+([A-Z0-9-]+)", re.IGNORECASE)


def call_api(prompt: str, options: dict, context: dict) -> dict:  # type: ignore[type-arg]
    """Return fixture JSON for the invoice ID found in *prompt*."""
    match = _INV_ID_RE.search(prompt)
    if match:
        inv_id = match.group(1).strip()
        if inv_id in _FIXTURES:
            return {
                "output": json.dumps(_FIXTURES[inv_id]),
                "tokenUsage": {"total": 0, "prompt": 0, "completion": 0},
            }

    return {
        "output": json.dumps({
            "error": "no_fixture_match",
            "prompt_excerpt": prompt[:120],
        }),
        "tokenUsage": {"total": 0, "prompt": 0, "completion": 0},
    }
