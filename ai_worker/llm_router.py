"""Multi-LLM router with fallback chain using LiteLLM and DSPy."""

import logging
from typing import Optional

import dspy
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Strictly validated environment settings for LLM API keys."""

    model_config = ConfigDict(strict=True, case_sensitive=True)

    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str


def get_configured_lm() -> dspy.LM:
    """Return a DSPy LM with primary Claude + fallback GPT-4o.

    Configured with timeouts and retries for resilience.
    Sets the global dspy.settings.lm.
    """
    settings = Settings()

    lm = dspy.LM(
        model="anthropic/claude-3-5-sonnet-latest",
        api_key=settings.ANTHROPIC_API_KEY,
        max_tokens=4096,
        timeout=30,
        max_retries=3,
        fallbacks=[
            dspy.LM(
                model="openai/gpt-4o",
                api_key=settings.OPENAI_API_KEY,
                timeout=30,
                max_retries=2,
            )
        ],
    )

    dspy.configure(lm=lm)
    logger.info("Configured DSPy with Claude-3.5-Sonnet (primary) + GPT-4o (fallback)")
    return lm


def get_fast_lm() -> dspy.LM:
    """Return a fast, cost-efficient LM for lightweight tasks.

    Uses Gemini Flash for rapid classification, routing, etc.
    """
    settings = Settings()

    lm = dspy.LM(
        model="gemini/gemini-2.0-flash",
        api_key=settings.GEMINI_API_KEY,
        timeout=15,
        max_retries=2,
    )
    logger.info("Initialized fast LM: Gemini 2.0 Flash")
    return lm
