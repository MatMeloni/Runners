"""Configuração carregada exclusivamente do arquivo `.env` na raiz do repositório."""

import os
from pathlib import Path

from dotenv import load_dotenv

_root = Path(__file__).resolve().parents[1]
_env_path = _root / ".env"
load_dotenv(_env_path)


class ConfigurationError(RuntimeError):
    """Falta variável obrigatória no `.env` (use `.env.example` como modelo)."""


def _require(name: str) -> str:
    value = os.getenv(name)
    if value is None or (isinstance(value, str) and value.strip() == ""):
        raise ConfigurationError(
            f"Defina a variável {name} no arquivo .env (copie de .env.example)."
        )
    return value.strip()


API_HOST: str = _require("API_HOST")
API_PORT: int = int(_require("API_PORT"))


def get_database_url() -> str:
    raw = _require("DATABASE_URL")
    url = raw.strip().strip('"').strip("'")
    lower = url.lower()
    if lower.startswith("https://") or lower.startswith("http://"):
        raise ConfigurationError(
            "DATABASE_URL não pode ser a URL do projeto no navegador (https://....supabase.co). "
            "No Supabase: Settings → Database → Connection string → URI PostgreSQL (começa com postgresql://)."
        )
    if not (lower.startswith("postgresql://") or lower.startswith("postgres://")):
        raise ConfigurationError(
            "DATABASE_URL deve ser uma URI PostgreSQL (postgresql:// ou postgres://). "
            "Copie em Settings → Database, não em API Keys."
        )
    return url


def get_cors_origins() -> list[str]:
    raw = _require("CORS_ORIGINS")
    parts = [o.strip() for o in raw.split(",") if o.strip()]
    return parts if parts else ["*"]


def get_supabase_jwt_secret() -> str:
    """Segredo JWT do projeto Supabase (Settings → API → JWT Secret)."""
    return _require("SUPABASE_JWT_SECRET")
