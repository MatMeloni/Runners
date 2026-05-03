"""WebSocket endpoint para análise de pose em tempo real via câmera.

Importações pesadas (OpenCV, MediaPipe) são adiadas: o módulo carrega rápido para o
worker aceitar o WebSocket; cv2/numpy só no primeiro frame com imagem; MediaPipe na
primeira chamada a _run_pose.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import threading
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger(__name__)

_estimator: Any = None
_estimator_lock = threading.Lock()

_cv2: Any = None
_np: Any = None
_cv_deps_lock = threading.Lock()


def _decode_deps() -> tuple[Any, Any]:
    """Carrega OpenCV e NumPy na primeira frame real (após o handshake WebSocket)."""
    global _cv2, _np
    with _cv_deps_lock:
        if _cv2 is None:
            import cv2
            import numpy as np

            _cv2, _np = cv2, np
    return _cv2, _np


def _get_estimator() -> Any:
    global _estimator
    with _estimator_lock:
        if _estimator is None:
            from src.processing.pose_estimator import PoseEstimator

            logger.info("Inicializando PoseEstimator para análise ao vivo...")
            _estimator = PoseEstimator(running_mode="image")
    return _estimator


def _run_pose(frame_rgb: Any) -> dict:
    from src.analysis.angles import compute_joint_angles

    estimator = _get_estimator()
    with _estimator_lock:
        result = estimator.process(frame_rgb)
        landmarks = estimator.get_landmarks_list(result)
    angles = compute_joint_angles(landmarks)
    return {"detected": landmarks is not None, "angles": angles}


@router.websocket("/ws/live")
async def live_analysis(websocket: WebSocket) -> None:
    await websocket.accept()
    logger.info("WebSocket /ws/live conectado de %s", websocket.client)
    loop = asyncio.get_event_loop()
    try:
        while True:
            data = await websocket.receive_json()
            frame_b64: str = data.get("frame", "")
            if not frame_b64:
                await websocket.send_json({"detected": False, "angles": {}})
                continue

            cv2, np = _decode_deps()
            img_bytes = base64.b64decode(frame_b64)
            arr = np.frombuffer(img_bytes, dtype=np.uint8)
            frame_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame_bgr is None:
                await websocket.send_json({"detected": False, "angles": {}})
                continue

            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            payload = await loop.run_in_executor(None, _run_pose, frame_rgb)
            await websocket.send_json(payload)

    except WebSocketDisconnect:
        logger.info("WebSocket /ws/live desconectado")
    except Exception as exc:
        logger.exception("Erro no WebSocket /ws/live: %s", exc)
