"""`/reconcile-batch` returns 409 when the tenant workspace has no pending PDFs."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def reconcile_batch_client(monkeypatch: pytest.MonkeyPatch, tmp_path) -> Generator[TestClient]:
    """Gateway app with empty ``demo_empty`` invoice dir and tenant override."""
    from api_gateway import deps
    import api_gateway.main as gm

    inv_root = tmp_path / "invoices"
    (inv_root / "demo_empty").mkdir(parents=True)
    monkeypatch.setattr(gm, "INVOICES_DIR", inv_root)

    async def fake_tenant() -> str:
        return "demo_empty"

    gm.app.dependency_overrides[deps.get_tenant_id] = fake_tenant
    try:
        with TestClient(gm.app) as client:
            yield client
    finally:
        gm.app.dependency_overrides.clear()


def test_reconcile_batch_no_invoices_conflict(reconcile_batch_client: TestClient) -> None:
    res = reconcile_batch_client.post(
        "/reconcile-batch",
        headers={"X-Session-Id": "demo_empty"},
    )
    assert res.status_code == 409
    body = res.json()
    assert body["detail"]["code"] == "NO_INVOICES_PENDING"
    assert "message" in body["detail"]
