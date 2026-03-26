"""Sobe a API em modo desenvolvimento (reload), usando variáveis do `.env` na raiz."""

from __future__ import annotations

import sys
from pathlib import Path

_root = Path(__file__).resolve().parents[1]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

import uvicorn

from api.config import API_HOST, API_PORT


def main() -> None:
    uvicorn.run(
        "api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        reload_dirs=[str(_root / "api")],
    )


if __name__ == "__main__":
    main()
