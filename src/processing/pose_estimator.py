"""Wrapper do MediaPipe PoseLandmarker (Tasks API) para estimativa de landmarks."""

import urllib.request
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np

_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "pose_landmarker/pose_landmarker_full/float16/latest/"
    "pose_landmarker_full.task"
)
_MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "models"
_MODEL_PATH = _MODEL_DIR / "pose_landmarker_full.task"

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode


def _ensure_model() -> str:
    """Baixa o modelo do GCS se ainda nao existir localmente."""
    if _MODEL_PATH.exists():
        return str(_MODEL_PATH)
    _MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Baixando modelo MediaPipe PoseLandmarker em {_MODEL_PATH} ...")
    urllib.request.urlretrieve(_MODEL_URL, str(_MODEL_PATH))
    print("Download concluido.")
    return str(_MODEL_PATH)


class PoseEstimator:
    """Estimativa de pose com MediaPipe Tasks API; processa frame RGB e retorna landmarks."""

    def __init__(
        self,
        model_complexity: int = 1,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        running_mode: str = "video",
    ):
        model_path = _ensure_model()

        if running_mode == "image":
            mode = VisionRunningMode.IMAGE
        else:
            mode = VisionRunningMode.VIDEO

        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=mode,
            num_poses=1,
            min_pose_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._landmarker = PoseLandmarker.create_from_options(options)
        self._running_mode = mode
        self._frame_ts_ms = 0

    def process(self, frame_rgb: np.ndarray) -> Any:
        """
        Processa um frame RGB (H, W, 3).
        Retorna PoseLandmarkerResult.
        """
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        if self._running_mode == VisionRunningMode.IMAGE:
            return self._landmarker.detect(mp_image)

        self._frame_ts_ms += 33
        return self._landmarker.detect_for_video(mp_image, self._frame_ts_ms)

    def get_landmarks_list(self, result: Any) -> list[dict[str, float]] | None:
        """
        Extrai lista de landmarks a partir do resultado.
        Cada item: {"x": 0..1, "y": 0..1, "z": relativo, "visibility": 0..1}.
        Retorna None se nao houver deteccao.
        """
        if not result.pose_landmarks:
            return None
        landmarks = result.pose_landmarks[0]
        out = []
        for lm in landmarks:
            out.append({
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility,
            })
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
        self._landmarker.close()

    def __enter__(self) -> "PoseEstimator":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
