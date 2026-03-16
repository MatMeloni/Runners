"""Módulos de captura de vídeo (webcam e arquivo)."""

from src.capture.webcam import WebcamCapture
from src.capture.video_file import VideoFileCapture

__all__ = ["WebcamCapture", "VideoFileCapture"]
