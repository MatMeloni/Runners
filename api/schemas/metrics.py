from pydantic import BaseModel


class BiomechanicsMetrics(BaseModel):
    angles: dict[str, float] = {}
    ground_contact_time_s: float | None = None
    cadence_steps_per_min: float | None = None
    distance_m: float | None = None
