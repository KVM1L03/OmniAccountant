"""Multi-LLM router with fallback chain using LiteLLM and DSPy."""

import logging
import os

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

    # Expose keys as env vars so LiteLLM auto-discovers them per provider
    os.environ.setdefault("ANTHROPIC_API_KEY", settings.ANTHROPIC_API_KEY)
    os.environ.setdefault("OPENAI_API_KEY", settings.OPENAI_API_KEY)
    os.environ.setdefault("GEMINI_API_KEY", settings.GEMINI_API_KEY)

    lm = dspy.LM(
        model="anthropic/claude-3-5-sonnet-latest",
        max_tokens=4096,
        timeout=30,
        max_retries=3,
        fallbacks=["openai/gpt-4o"],
    )

    dspy.configure(lm=lm)
    logger.info("Configured DSPy with Claude-3.5-Sonnet (primary) + GPT-4o (fallback)")
    return lm


def get_fast_lm() -> dspy.LM:
    """Return a fast, cost-efficient LM for lightweight tasks.

    Uses Gemini Flash for rapid classification, routing, etc.
    """
    settings = Settings()

    os.environ.setdefault("GEMINI_API_KEY", settings.GEMINI_API_KEY)

    lm = dspy.LM(
        model="gemini/gemini-2.0-flash",
        timeout=15,
        max_retries=2,
    )
    logger.info("Initialized fast LM: Gemini 2.0 Flash")
    return lm
