"""Pytest configuration for top-level tests."""

import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture(scope="session", autouse=True)
def seed_erp_db() -> None:
    """Ensure erp_mock.db exists and is seeded before any test runs.

    erp_mock.db is gitignored so CI always starts without it.
    """
    from mcp_bridge.init_db import init_db

    init_db()
