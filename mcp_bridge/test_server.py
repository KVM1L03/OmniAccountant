"""Tests for the verify_purchase_order MCP tool."""

import pytest
from mcp_bridge.server import verify_purchase_order


@pytest.mark.asyncio
async def test_valid_match() -> None:
    """INV-2026-001 with the correct ERP amount should return 'match'."""
    result = await verify_purchase_order("INV-2026-001", 5425.00)
    assert result["status"] == "match"
    assert result["diff"] == 0.0


@pytest.mark.asyncio
async def test_discrepancy() -> None:
    """INV-2026-004 with the invoice-stated total should return 'discrepancy'."""
    result = await verify_purchase_order("INV-2026-004", 16867.50)
    assert result["status"] == "discrepancy"
    assert result["expected"] == 16817.50
    assert result["diff"] == -50.0


@pytest.mark.asyncio
async def test_sql_injection_returns_not_found() -> None:
    """A malicious invoice_id must be treated as a literal string, not SQL."""
    malicious_id = "INV-2026-001' OR '1'='1"
    result = await verify_purchase_order(malicious_id, 0.0)
    assert result["status"] == "not_found"
