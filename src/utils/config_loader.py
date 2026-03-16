"""Carrega configuração a partir de YAML/JSON na pasta config/."""

from pathlib import Path
from typing import Any

import yaml


def load_config(config_name: str = "default") -> dict[str, Any]:
    """
    Carrega arquivo de configuração da pasta config/.
    Suporta .yaml e .yml. Retorna dict com o conteúdo.
    """
    base = Path(__file__).resolve().parent.parent.parent
    config_dir = base / "config"
    for ext in (".yaml", ".yml"):
        path = config_dir / f"{config_name}{ext}"
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
    return {}


def get_config(config_name: str | None = None) -> dict[str, Any]:
    """Retorna a configuração (default se config_name for None)."""
    return load_config(config_name or "default")
