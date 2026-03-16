"""Captura de vídeo via webcam com OpenCV."""

from typing import Iterator

import cv2
import numpy as np


class WebcamCapture:
    """Abstração para leitura de frames da webcam."""

    def __init__(self, camera_index: int = 0, width: int | None = None, height: int | None = None):
        self.camera_index = camera_index
        self._cap: cv2.VideoCapture | None = None
        self._width = width
        self._height = height

    def open(self) -> bool:
        """Abre o dispositivo de câmera. Retorna True se sucesso."""
        self._cap = cv2.VideoCapture(self.camera_index)
        if not self._cap.isOpened():
            return False
        if self._width is not None:
            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self._width)
        if self._height is not None:
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)
        return True

    def read(self) -> tuple[bool, np.ndarray | None]:
        """
        Lê o próximo frame. Retorna (success, frame).
        frame é BGR (OpenCV); None se falha.
        """
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        if not ret or frame is None:
            return False, None
        return True, frame

    def frames(self) -> Iterator[np.ndarray]:
        """Generator que entrega frames até falha ou interrupção."""
        while True:
            ret, frame = self.read()
            if not ret or frame is None:
                break
            yield frame

    def release(self) -> None:
        """Libera o recurso da câmera."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def __enter__(self) -> "WebcamCapture":
        self.open()
        return self

    def __exit__(self, *args: object) -> None:
        self.release()
