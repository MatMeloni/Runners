def get_health_status(db_available: bool) -> dict[str, str]:
    return {
        "status": "ok" if db_available else "degraded",
        "database": "up" if db_available else "down",
    }
