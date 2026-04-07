"""Multi-LLM router with fallback chain using LiteLLM and DSPy."""

import logging
import os
import threading

import dspy
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_primary_lm: dspy.LM | None = None
_fast_lm: dspy.LM | None = None
_lm_lock = threading.Lock()


class Settings(BaseSettings):
    """Strictly validated environment settings for LLM API keys."""

    model_config = ConfigDict(strict=True, case_sensitive=True)

    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str


def _build_primary_lm() -> dspy.LM:
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

    logger.info(
        "Configured DSPy LM (process singleton): Claude-3.5-Sonnet + GPT-4o fallback"
    )
    return lm


def get_configured_lm() -> dspy.LM:
    """Return the process-wide primary DSPy LM (thread-safe singleton).

    DSPy forbids re-initializing global settings from concurrent code paths.
    Temporal runs activities on a thread pool, so parallel batch items must
    share one ``dspy.LM`` instance. Callers still scope usage with
    ``dspy.context(lm=...)`` per prediction.
    """
    global _primary_lm
    if _primary_lm is not None:
        return _primary_lm
    with _lm_lock:
        if _primary_lm is None:
            _primary_lm = _build_primary_lm()
        return _primary_lm


def _build_fast_lm() -> dspy.LM:
    settings = Settings()
    os.environ.setdefault("GEMINI_API_KEY", settings.GEMINI_API_KEY)
    lm = dspy.LM(
        model="gemini/gemini-2.0-flash",
        timeout=15,
        max_retries=2,
    )
    logger.info("Initialized fast LM (process singleton): Gemini 2.0 Flash")
    return lm


def get_fast_lm() -> dspy.LM:
    """Return the process-wide fast LM for lightweight tasks (thread-safe singleton)."""
    global _fast_lm
    if _fast_lm is not None:
        return _fast_lm
    with _lm_lock:
        if _fast_lm is None:
            _fast_lm = _build_fast_lm()
        return _fast_lm
