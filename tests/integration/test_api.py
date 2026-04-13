"""Testes de integração da API (endpoints HTTP com DB mockada)."""

import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(test_client):
    """GET /health retorna 200 e body com chave 'status'."""
    resp = await test_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert "status" in body


@pytest.mark.asyncio
async def test_get_metrics(test_client):
    """GET /api/metrics retorna 200 e body com chave 'angles'."""
    resp = await test_client.get("/api/metrics")
    assert resp.status_code == 200
    body = resp.json()
    assert "angles" in body


@pytest.mark.asyncio
async def test_create_session(test_client, mock_db):
    """POST /api/sessions com body válido retorna 200 e body com 'id'."""
    from datetime import datetime
    from unittest.mock import MagicMock

    from api.database import SessionModel

    fake_row = MagicMock(spec=SessionModel)
    fake_row.id = 1
    fake_row.name = "test"
    fake_row.source = "webcam"
    fake_row.created_at = datetime.utcnow()
    fake_row.metadata_ = None
    fake_row.status = "pending"
    fake_row.video_path = None
    fake_row.error_msg = None

    def _refresh(obj):
        for attr in ("id", "name", "source", "created_at", "metadata_", "status", "video_path", "error_msg"):
            setattr(obj, attr, getattr(fake_row, attr))

    mock_db.refresh.side_effect = _refresh

    mock_db.add.return_value = None
    mock_db.commit.return_value = None

    resp = await test_client.post(
        "/api/sessions", json={"name": "test", "source": "webcam"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "id" in body


@pytest.mark.asyncio
async def test_get_session_not_found(test_client):
    """GET /api/sessions/999999 retorna 404."""
    resp = await test_client.get("/api/sessions/999999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_session_status_not_found(test_client):
    """GET /api/sessions/999999/status retorna 404."""
    resp = await test_client.get("/api/sessions/999999/status")
    assert resp.status_code == 404
