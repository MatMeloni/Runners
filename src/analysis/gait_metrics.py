"""Métricas de marcha: tempo de contato com o solo, cadência, distância."""

from statistics import median
from typing import Sequence

from src.utils.constants import (
    LANDMARK_ANKLE_LEFT,
    LANDMARK_ANKLE_RIGHT,
    LANDMARK_HEEL_LEFT,
    LANDMARK_HEEL_RIGHT,
)

GROUND_Y_THRESHOLD = 0.85
MIN_VISIBILITY = 0.5


def _is_on_ground(landmark: dict, threshold: float = GROUND_Y_THRESHOLD) -> bool:
    """Verifica se um landmark de calcanhar está em contato com o solo."""
    vis = landmark.get("visibility", 1.0)
    return landmark["y"] > threshold and vis > MIN_VISIBILITY


def _detect_ground_contacts(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    heel_idx: int,
    fps: float,
) -> list[float]:
    """Detecta contatos com o solo e retorna lista de durações (s) por contato."""
    contacts: list[float] = []
    consecutive = 0

    for frame_lms in landmarks_sequence:
        if frame_lms is None or len(frame_lms) <= heel_idx:
            if consecutive > 0:
                contacts.append(consecutive / fps)
                consecutive = 0
            continue

        if _is_on_ground(frame_lms[heel_idx]):
            consecutive += 1
        else:
            if consecutive > 0:
                contacts.append(consecutive / fps)
                consecutive = 0

    if consecutive > 0:
        contacts.append(consecutive / fps)

    return contacts


def estimate_ground_contact_time(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    fps: float,
) -> float | None:
    """
    Estima tempo de contato com o solo (GCT) em segundos.

    Rastreia a coordenada y dos calcanhar (heel) ao longo dos frames.
    Um pé está "no chão" quando heel y > threshold e visibility > 0.5.
    Retorna a mediana dos GCTs detectados, ou None se < 2 contatos.
    """
    if not landmarks_sequence or fps <= 0:
        return None

    contacts_left = _detect_ground_contacts(landmarks_sequence, LANDMARK_HEEL_LEFT, fps)
    contacts_right = _detect_ground_contacts(landmarks_sequence, LANDMARK_HEEL_RIGHT, fps)
    all_contacts = contacts_left + contacts_right

    if len(all_contacts) < 2:
        return None

    return round(median(all_contacts), 3)


def _detect_foot_strikes(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    ankle_idx: int,
) -> int:
    """Detecta foot strikes via mínimos locais na coordenada y do tornozelo."""
    y_values: list[float] = []
    for frame_lms in landmarks_sequence:
        if frame_lms is None or len(frame_lms) <= ankle_idx:
            continue
        lm = frame_lms[ankle_idx]
        vis = lm.get("visibility", 1.0)
        if vis > MIN_VISIBILITY:
            y_values.append(lm["y"])
        # Skip frames with low visibility (no value appended, preserves index continuity)

    strikes = 0
    for i in range(1, len(y_values) - 1):
        if y_values[i] > y_values[i - 1] and y_values[i] > y_values[i + 1]:
            strikes += 1

    return strikes


def estimate_cadence(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    fps: float,
) -> float | None:
    """
    Estima cadência (passos por minuto).

    Rastreia oscilação vertical de cada tornozelo e detecta mínimos locais
    (foot strike = ponto mais baixo do tornozelo em coords normalizadas,
    i.e., valor máximo de y). Retorna None se < 4 strikes detectados.
    """
    if not landmarks_sequence or fps <= 0:
        return None

    valid = [lm for lm in landmarks_sequence if lm and len(lm) > LANDMARK_ANKLE_RIGHT]
    if len(valid) < 4:
        return None

    strikes_left = _detect_foot_strikes(landmarks_sequence, LANDMARK_ANKLE_LEFT)
    strikes_right = _detect_foot_strikes(landmarks_sequence, LANDMARK_ANKLE_RIGHT)
    total_strikes = strikes_left + strikes_right

    if total_strikes < 4:
        return None

    total_duration_s = len(landmarks_sequence) / fps
    if total_duration_s <= 0:
        return None

    cadence = (total_strikes / total_duration_s) * 60.0
    return round(cadence, 1)


def estimate_distance(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    cadence_steps_per_min: float | None = None,
    stride_length_m: float = 1.2,
    duration_s: float | None = None,
    fps: float | None = None,
) -> float | None:
    """
    Estima distância percorrida em metros.

    Usa cadência e duração: distance = (cadence/60) * duration * stride_length.
    Se duration_s não for fornecido, estima a partir do número de frames e fps.
    Retorna None se dados insuficientes.
    """
    if not landmarks_sequence:
        return None

    if duration_s is None and fps is not None and fps > 0:
        duration_s = len(landmarks_sequence) / fps

    if duration_s is not None and cadence_steps_per_min is not None and cadence_steps_per_min > 0:
        steps = (cadence_steps_per_min / 60.0) * duration_s
        return round(steps * stride_length_m, 2)

    return None


def compute_gait_metrics(
    landmarks_sequence: Sequence[Sequence[dict] | None],
    fps: float,
    duration_s: float | None = None,
) -> dict[str, float]:
    """
    Agrega GCT, cadência e distância em um único dict.
    Valores None são omitidos do resultado.
    """
    out: dict[str, float] = {}
    gct = estimate_ground_contact_time(landmarks_sequence, fps)
    if gct is not None:
        out["ground_contact_time_s"] = gct
    cadence = estimate_cadence(landmarks_sequence, fps)
    if cadence is not None:
        out["cadence_steps_per_min"] = cadence
    dist = estimate_distance(
        landmarks_sequence,
        cadence_steps_per_min=cadence,
        duration_s=duration_s,
        fps=fps,
    )
    if dist is not None:
        out["distance_m"] = dist
    return out
