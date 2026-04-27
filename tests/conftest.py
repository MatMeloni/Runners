"""Fixtures e helpers compartilhados para testes."""

import os
import uuid
from unittest.mock import MagicMock

import httpx
import pytest
from sqlalchemy.orm import Session as OrmSession

os.environ.setdefault("API_HOST", "127.0.0.1")
os.environ.setdefault("API_PORT", "8000")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("CORS_ORIGINS", "*")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-for-jwt-encoding-only")

from api.auth import get_current_user_id  # noqa: E402
from api.database import get_db_session  # noqa: E402
from api.main import app  # noqa: E402

TEST_USER_ID = uuid.UUID("00000000-0000-4000-8000-000000000001")


def make_landmarks(n: int = 33) -> list[dict[str, float]]:
    """Cria lista de n landmarks com valores padrão centralizados."""
    return [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 1.0} for _ in range(n)]


@pytest.fixture()
def mock_db():
    """Sessão de banco mockada para testes unitários e de integração."""
    db = MagicMock(spec=OrmSession)
    db.query.return_value.order_by.return_value.all.return_value = []
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.count.return_value = 0
    return db


@pytest.fixture()
async def test_client(mock_db):
    """Cliente HTTP com DB mockada (rotas protegidas exigem JWT real ou override em outro fixture)."""
    app.dependency_overrides[get_db_session] = lambda: mock_db
    app.state.db_available = True
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture()
async def authenticated_client(mock_db):
    """Cliente HTTP com DB mockada e utilizador autenticado fixo (sem PyJWT nos testes)."""
    async def _fake_user() -> uuid.UUID:
        return TEST_USER_ID

    app.dependency_overrides[get_db_session] = lambda: mock_db
    app.dependency_overrides[get_current_user_id] = _fake_user
    app.state.db_available = True
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
