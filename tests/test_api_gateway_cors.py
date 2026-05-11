from __future__ import annotations

import importlib

import api_gateway.main


def test_cors_origins_are_loaded_from_frontend_origins_env(monkeypatch) -> None:
    monkeypatch.setenv(
        "FRONTEND_ORIGINS",
        "https://frontend-production.up.railway.app, http://localhost:3000 ",
    )

    module = importlib.reload(api_gateway.main)

    cors_middleware = next(
        middleware
        for middleware in module.app.user_middleware
        if middleware.cls.__name__ == "CORSMiddleware"
    )
    assert cors_middleware.kwargs["allow_origins"] == [
        "https://frontend-production.up.railway.app",
        "http://localhost:3000",
    ]
