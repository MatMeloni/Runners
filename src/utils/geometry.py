"""Funções de geometria para ângulos e distâncias (2D/3D)."""

from math import acos, degrees, sqrt
from typing import Sequence


def angle_between_vectors(
    v1: Sequence[float], v2: Sequence[float], degrees_output: bool = True
) -> float:
    """
    Ângulo entre dois vetores (2D ou 3D).
    Retorna em graus se degrees_output=True, senão em radianos.
    """
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = sqrt(sum(a * a for a in v1))
    norm2 = sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    cos_angle = max(-1.0, min(1.0, dot / (norm1 * norm2)))
    rad = acos(cos_angle)
    return degrees(rad) if degrees_output else rad


def vector_between(
    start: Sequence[float], end: Sequence[float]
) -> list[float]:
    """Retorna o vetor end - start como lista."""
    return [e - s for s, e in zip(start, end)]


def distance(p1: Sequence[float], p2: Sequence[float]) -> float:
    """Distância euclidiana entre dois pontos (2D ou 3D)."""
    return sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))
