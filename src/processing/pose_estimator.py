"""Wrapper do MediaPipe Pose para estimativa de landmarks."""

from typing import Any

import cv2
import mediapipe as mp
import numpy as np


class PoseEstimator:
    """Estimativa de pose com MediaPipe; processa frame RGB e retorna landmarks."""

    def __init__(
        self,
        model_complexity: int = 1,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self._pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def process(self, frame_rgb: np.ndarray) -> Any:
        """
        Processa um frame RGB (H, W, 3). Retorna resultado MediaPipe
        com .pose_landmarks (lista de landmark ou None).
        """
        return self._pose.process(frame_rgb)

    def get_landmarks_list(self, result: Any) -> list[dict[str, float]] | None:
        """
        Extrai lista de landmarks a partir do resultado.
        Cada item: {"x": 0..1, "y": 0..1, "z": relativo}.
        Retorna None se não houver detecção.
        """
        if result.pose_landmarks is None:
            return None
        out = []
        for lm in result.pose_landmarks.landmark:
            out.append({"x": lm.x, "y": lm.y, "z": lm.z})
        return out

    def get_landmarks_pixel(
        self, result: Any, width: int, height: int
    ) -> list[tuple[float, float]] | None:
        """Converte landmarks normalizados para coordenadas em pixels (x, y)."""
        lst = self.get_landmarks_list(result)
        if lst is None:
            return None
        return [(lm["x"] * width, lm["y"] * height) for lm in lst]

    def close(self) -> None:
        """Libera recursos do MediaPipe."""
        self._pose.close()

    def __enter__(self) -> "PoseEstimator":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
