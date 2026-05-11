"""Tests for ``shared.temporal_connect`` environment mapping."""

from __future__ import annotations

import shared.temporal_connect as tc


def test_load_temporal_connect_kwargs_minimal_local(monkeypatch) -> None:
    monkeypatch.delenv("TEMPORAL_CONFIG_FILE", raising=False)
    monkeypatch.delenv("TEMPORAL_NAMESPACE", raising=False)
    monkeypatch.delenv("TEMPORAL_API_KEY", raising=False)
    monkeypatch.setenv("TEMPORAL_ADDRESS", "temporal:7233")

    kw = tc.load_temporal_connect_kwargs()
    assert kw["target_host"] == "temporal:7233"


def test_load_temporal_connect_kwargs_cloud_api_key(monkeypatch) -> None:
    monkeypatch.delenv("TEMPORAL_CONFIG_FILE", raising=False)
    monkeypatch.setenv("TEMPORAL_ADDRESS", "demo.ns.tmprl.cloud:7233")
    monkeypatch.setenv("TEMPORAL_NAMESPACE", "demo-namespace")
    monkeypatch.setenv("TEMPORAL_API_KEY", "tkn_xyz")

    kw = tc.load_temporal_connect_kwargs()
    assert kw["target_host"] == "demo.ns.tmprl.cloud:7233"
    assert kw["namespace"] == "demo-namespace"
    assert kw["api_key"] == "tkn_xyz"
    assert kw["tls"] is True
