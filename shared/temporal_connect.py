"""Temporal Client connection from environment (local, self-hosted, Temporal Cloud).

Reads the standard ``TEMPORAL_*`` variables documented at
https://docs.temporal.io/references/client-environment-configuration

By default no TOML file is loaded so containers and CI stay predictable; set
``TEMPORAL_CONFIG_FILE`` to opt into a profile file (and optional
``TEMPORAL_PROFILE``).

**Railway**: enable private networking between services so
``TEMPORAL_ADDRESS=*.railway.internal:7233`` can reach Temporal. The API gateway
uses a **lazy** Temporal client so ``/docs`` can boot before Temporal accepts
TCP. Worker retries are controlled by ``TEMPORAL_CONNECT_RETRIES`` and
``TEMPORAL_CONNECT_RETRY_DELAY``.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, cast

from temporalio.client import Client
from temporalio.envconfig import ClientConfig

logger = logging.getLogger(__name__)


def load_temporal_connect_kwargs() -> dict[str, Any]:
    """Build keyword arguments for ``Client.connect`` from the environment."""
    config_file = os.environ.get("TEMPORAL_CONFIG_FILE")
    profile = os.environ.get("TEMPORAL_PROFILE")

    kw: dict[str, Any] = dict(
        ClientConfig.load_client_connect_config(
            profile=profile,
            config_file=config_file if config_file else None,
            disable_file=config_file is None,
        )
    )
    kw.setdefault(
        "target_host",
        os.environ.get("TEMPORAL_ADDRESS", "localhost:7233"),
    )
    return kw


async def connect_temporal_client(*, lazy: bool = False) -> Client:
    """Connect using env (single attempt).

    Args:
        lazy: Passed to Temporal SDK — defer TCP until first RPC. Required for
            api-gateway startup on PaaS when Temporal boots slower than FastAPI.

    """
    kw = load_temporal_connect_kwargs()
    kw["lazy"] = lazy
    target = cast(str, kw["target_host"])
    namespace = kw.get("namespace", "default")
    tls_info = kw.get("tls")
    has_api_key = bool(kw.get("api_key"))
    logger.info(
        "Connecting Temporal client target=%s namespace=%s tls=%s api_key=%s lazy=%s",
        target,
        namespace,
        type(tls_info).__name__ if tls_info is not None else "default",
        has_api_key,
        lazy,
    )
    return await Client.connect(**kw)  # type: ignore[arg-type]


async def connect_temporal_worker_client() -> Client:
    """Eager Temporal client with retries — required for Temporal workers."""

    max_attempts = max(1, int(os.environ.get("TEMPORAL_CONNECT_RETRIES", "36")))
    delay_s = max(0.5, float(os.environ.get("TEMPORAL_CONNECT_RETRY_DELAY", "5")))
    last_error: BaseException | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            return await connect_temporal_client(lazy=False)
        except BaseException as exc:
            last_error = exc
            logger.warning(
                "Temporal worker connect attempt %d/%d failed: %s",
                attempt,
                max_attempts,
                exc,
            )
            if attempt < max_attempts:
                await asyncio.sleep(delay_s)
    assert last_error is not None
    raise last_error
