"""Pipeline: frame BGR -> pose -> frame anotado + landmarks."""

from typing import Any

import cv2
import mediapipe as mp
import numpy as np

from src.processing.pose_estimator import PoseEstimator


class ProcessingPipeline:
    """
    Recebe frame BGR (OpenCV), converte para RGB, executa pose estimation,
    opcionalmente desenha esqueleto e retorna frame anotado + landmarks.
    """

    def __init__(self, pose_estimator: PoseEstimator | None = None, draw_landmarks: bool = True):
        self._pose = pose_estimator or PoseEstimator()
        self._draw_landmarks = draw_landmarks
        self._mp_drawing = mp.solutions.drawing_utils
        self._mp_pose = mp.solutions.pose

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
        if self._draw_landmarks and result.pose_landmarks is not None:
            self._mp_drawing.draw_landmarks(
                out_frame,
                result.pose_landmarks,
                self._mp_pose.POSE_CONNECTIONS,
                self._mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
                self._mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=1, circle_radius=1),
            )
        return out_frame, landmarks
