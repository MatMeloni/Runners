"""Pipeline: frame BGR -> pose -> frame anotado + landmarks."""

from typing import Any

import cv2
import numpy as np

from src.processing.pose_estimator import PoseEstimator

POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    (11, 12),
    (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
]


def _draw_landmarks_on_frame(
    frame: np.ndarray,
    landmarks: list[dict[str, float]],
    connections: list[tuple[int, int]] = POSE_CONNECTIONS,
    point_color: tuple[int, int, int] = (0, 255, 0),
    line_color: tuple[int, int, int] = (255, 255, 255),
    thickness: int = 1,
    radius: int = 3,
) -> None:
    """Desenha landmarks e conexoes diretamente no frame com OpenCV."""
    h, w = frame.shape[:2]
    pts = [(int(lm["x"] * w), int(lm["y"] * h)) for lm in landmarks]

    for start, end in connections:
        if start < len(pts) and end < len(pts):
            cv2.line(frame, pts[start], pts[end], line_color, thickness)

    for pt in pts:
        cv2.circle(frame, pt, radius, point_color, -1)


class ProcessingPipeline:
    """
    Recebe frame BGR (OpenCV), converte para RGB, executa pose estimation,
    opcionalmente desenha esqueleto e retorna frame anotado + landmarks.
    """

    def __init__(self, pose_estimator: PoseEstimator | None = None, draw_landmarks: bool = True):
        self._pose = pose_estimator or PoseEstimator()
        self._draw_landmarks = draw_landmarks

    def process(
        self, frame_bgr: np.ndarray
    ) -> tuple[np.ndarray, list[dict[str, float]] | None]:
        """
        frame_bgr: frame BGR (OpenCV).
        Retorna (frame_anotado, landmarks_normalizados ou None).
        """
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        result = self._pose.process(rgb)
        landmarks = self._pose.get_landmarks_list(result)

        out_frame = frame_bgr.copy()
        if self._draw_landmarks and landmarks is not None:
            _draw_landmarks_on_frame(out_frame, landmarks)

        return out_frame, landmarks
