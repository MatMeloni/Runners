from api.schemas.metrics import BiomechanicsMetrics


def get_stub_metrics() -> BiomechanicsMetrics:
    """
    Métricas biomecânicas (stub).
    Em produção: receberia frame ou session_id e usaria o pipeline de visão.
    """
    return BiomechanicsMetrics(
        angles={
            "knee_left": 165.0,
            "knee_right": 162.0,
            "hip_left": 145.0,
            "hip_right": 148.0,
            "trunk": 85.0,
        },
        ground_contact_time_s=0.25,
        cadence_steps_per_min=170.0,
        distance_m=50.0,
    )
