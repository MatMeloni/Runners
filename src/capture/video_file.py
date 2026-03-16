"""Captura de vídeo a partir de arquivo com OpenCV."""

from pathlib import Path
from typing import Iterator

import cv2
import numpy as np


class VideoFileCapture:
    """Abstração para leitura de frames de um arquivo de vídeo."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self._cap: cv2.VideoCapture | None = None

    def open(self) -> bool:
        """Abre o arquivo de vídeo. Retorna True se sucesso."""
        self._cap = cv2.VideoCapture(str(self.path))
        return self._cap.isOpened()

    def read(self) -> tuple[bool, np.ndarray | None]:
        """
        Lê o próximo frame. Retorna (success, frame).
        frame é BGR (OpenCV); None se falha ou fim do vídeo.
        """
        if self._cap is None or not self._cap.isOpened():
            return False, None
        ret, frame = self._cap.read()
        if not ret or frame is None:
            return False, None
        return True, frame

    def frames(self) -> Iterator[np.ndarray]:
        """Generator que entrega frames até o fim do vídeo."""
        while True:
            ret, frame = self.read()
            if not ret or frame is None:
                break
            yield frame

    def release(self) -> None:
        """Libera o recurso do arquivo."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def __enter__(self) -> "VideoFileCapture":
        self.open()
        return self

    def __exit__(self, *args: object) -> None:
        self.release()
