"""Cálculo de ângulos articulares (joelho, quadril, tronco) a partir de landmarks."""

from typing import Sequence

from src.utils.constants import (
    LANDMARK_HIP_LEFT,
    LANDMARK_HIP_RIGHT,
    LANDMARK_KNEE_LEFT,
    LANDMARK_KNEE_RIGHT,
    LANDMARK_ANKLE_LEFT,
    LANDMARK_ANKLE_RIGHT,
    LANDMARK_SHOULDER_LEFT,
    LANDMARK_SHOULDER_RIGHT,
)
from src.utils.geometry import angle_between_vectors, vector_between


def _landmark_xy(landmarks: Sequence[dict], idx: int) -> list[float]:
    return [landmarks[idx]["x"], landmarks[idx]["y"]]


def knee_angle(
    landmarks: Sequence[dict], side: str = "left"
) -> float | None:
    """
    Ângulo do joelho (quadril-jelho-tornozelo) em graus.
    side: "left" ou "right".
    """
    if len(landmarks) < 29:
        return None
    if side == "left":
        hip = _landmark_xy(landmarks, LANDMARK_HIP_LEFT)
        knee = _landmark_xy(landmarks, LANDMARK_KNEE_LEFT)
        ankle = _landmark_xy(landmarks, LANDMARK_ANKLE_LEFT)
    else:
        hip = _landmark_xy(landmarks, LANDMARK_HIP_RIGHT)
        knee = _landmark_xy(landmarks, LANDMARK_KNEE_RIGHT)
        ankle = _landmark_xy(landmarks, LANDMARK_ANKLE_RIGHT)
    v1 = vector_between(ankle, knee)
    v2 = vector_between(hip, knee)
    return angle_between_vectors(v1, v2, degrees_output=True)


def hip_angle(
    landmarks: Sequence[dict], side: str = "left"
) -> float | None:
    """
    Ângulo do quadril (ombro-quadril-joelho) em graus.
    side: "left" ou "right".
    """
    if len(landmarks) < 27:
        return None
    if side == "left":
        shoulder = _landmark_xy(landmarks, LANDMARK_SHOULDER_LEFT)
        hip = _landmark_xy(landmarks, LANDMARK_HIP_LEFT)
        knee = _landmark_xy(landmarks, LANDMARK_KNEE_LEFT)
    else:
        shoulder = _landmark_xy(landmarks, LANDMARK_SHOULDER_RIGHT)
        hip = _landmark_xy(landmarks, LANDMARK_HIP_RIGHT)
        knee = _landmark_xy(landmarks, LANDMARK_KNEE_RIGHT)
    v1 = vector_between(knee, hip)
    v2 = vector_between(shoulder, hip)
    return angle_between_vectors(v1, v2, degrees_output=True)


def trunk_angle(landmarks: Sequence[dict]) -> float | None:
    """
    Inclinação do tronco em relação à vertical (eixo y).
    Usa quadril médio e ombro médio; retorna ângulo em graus.
    """
    if len(landmarks) < 25:
        return None
    hip_mid = [
        (landmarks[LANDMARK_HIP_LEFT]["x"] + landmarks[LANDMARK_HIP_RIGHT]["x"]) / 2,
        (landmarks[LANDMARK_HIP_LEFT]["y"] + landmarks[LANDMARK_HIP_RIGHT]["y"]) / 2,
    ]
    shoulder_mid = [
        (landmarks[LANDMARK_SHOULDER_LEFT]["x"] + landmarks[LANDMARK_SHOULDER_RIGHT]["x"]) / 2,
        (landmarks[LANDMARK_SHOULDER_LEFT]["y"] + landmarks[LANDMARK_SHOULDER_RIGHT]["y"]) / 2,
    ]
    trunk = vector_between(hip_mid, shoulder_mid)
    vertical = [0, -1]
    return angle_between_vectors(trunk, vertical, degrees_output=True)


def compute_joint_angles(landmarks: Sequence[dict] | None) -> dict[str, float]:
    """
    Calcula todos os ângulos articulares. Retorna dict com chaves
    knee_left, knee_right, hip_left, hip_right, trunk.
    Valores ausentes não entram no dict.
    """
    out: dict[str, float] = {}
    if landmarks is None or len(landmarks) < 29:
        return out
    for side, key_hip, key_knee in [
        ("left", "hip_left", "knee_left"),
        ("right", "hip_right", "knee_right"),
    ]:
        a = hip_angle(landmarks, side)
        if a is not None:
            out[key_hip] = round(a, 1)
        a = knee_angle(landmarks, side)
        if a is not None:
            out[key_knee] = round(a, 1)
    t = trunk_angle(landmarks)
    if t is not None:
        out["trunk"] = round(t, 1)
    return out
