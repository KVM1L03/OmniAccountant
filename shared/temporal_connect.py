"""Temporal Client connection from environment (local, self-hosted, Temporal Cloud).

Reads the standard ``TEMPORAL_*`` variables documented at
https://docs.temporal.io/references/client-environment-configuration

By default no TOML file is loaded so containers and CI stay predictable; set
``TEMPORAL_CONFIG_FILE`` to opt into a profile file (and optional
``TEMPORAL_PROFILE``).
"""

from __future__ import annotations

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


async def connect_temporal_client() -> Client:
    """Connect using env (and optional TOML profile file)."""
    kw = load_temporal_connect_kwargs()
    target = cast(str, kw["target_host"])
    namespace = kw.get("namespace", "default")
    tls_info = kw.get("tls")
    has_api_key = bool(kw.get("api_key"))
    logger.info(
        "Connecting Temporal client target=%s namespace=%s tls=%s api_key=%s",
        target,
        namespace,
        type(tls_info).__name__ if tls_info is not None else "default",
        has_api_key,
    )
    return await Client.connect(**kw)  # type: ignore[arg-type]
