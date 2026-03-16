"""Métricas de marcha: tempo de contato com o solo, cadência, distância."""

from typing import Sequence


def estimate_ground_contact_time(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    fps: float,
) -> float | None:
    """
    Estima tempo de contato com o solo (GCT) em segundos.
    Heurística: baseada em movimento vertical do quadril/calcanhar ao longo dos frames.
    landmarks_sequence: lista de landmarks por frame (pode ter None).
    Implementação stub: retorna valor placeholder até heurística real.
    """
    if not landmarks_sequence or fps <= 0:
        return None
    valid = [lm for lm in landmarks_sequence if lm and len(lm) > 28]
    if len(valid) < 2:
        return None
    # Stub: ~0.25 s típico para corrida
    return round(0.25, 2)


def estimate_cadence(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    fps: float,
) -> float | None:
    """
    Estima cadência (passos por minuto).
    Heurística: detecção de ciclos de passada (ex.: pico de joelho/quadril).
    Implementação stub: retorna placeholder.
    """
    if not landmarks_sequence or fps <= 0:
        return None
    valid = [lm for lm in landmarks_sequence if lm and len(lm) > 25]
    if len(valid) < 10:
        return None
    # Stub: 170 passos/min
    return round(170.0, 1)


def estimate_distance(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    cadence_steps_per_min: float | None = None,
    stride_length_m: float = 1.2,
    duration_s: float | None = None,
) -> float | None:
    """
    Estima distância percorrida em metros.
    Fórmula simplificada: (passos) * stride_length_m, ou usar duration e cadência.
    cadence_steps_per_min e duration_s permitem: distance = (cadence/60)*duration*stride_length_m.
    Stub: usa duração estimada pelo número de frames se duration_s não for passado.
    """
    if not landmarks_sequence:
        return None
    n_frames = len([lm for lm in landmarks_sequence if lm])
    if n_frames == 0:
        return None
    # Stub: assumir 30 fps e 170 spm, ~10 s de vídeo -> passos * stride
    if duration_s is not None and cadence_steps_per_min is not None and cadence_steps_per_min > 0:
        steps = (cadence_steps_per_min / 60.0) * duration_s
        return round(steps * stride_length_m, 2)
    # Fallback placeholder
    return round(50.0, 2)


def compute_gait_metrics(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    fps: float,
    duration_s: float | None = None,
) -> dict[str, float]:
    """
    Agrega GCT, cadência e distância em um único dict.
    duration_s opcional para estimativa de distância.
    """
    out: dict[str, float] = {}
    gct = estimate_ground_contact_time(landmarks_sequence, fps)
    if gct is not None:
        out["ground_contact_time_s"] = gct
    cadence = estimate_cadence(landmarks_sequence, fps)
    if cadence is not None:
        out["cadence_steps_per_min"] = cadence
    dist = estimate_distance(landmarks_sequence, cadence_steps_per_min=cadence, duration_s=duration_s)
    if dist is not None:
        out["distance_m"] = dist
    return out
