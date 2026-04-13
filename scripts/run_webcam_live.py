"""Analise biomecanica em tempo real via webcam com janela OpenCV nativa."""

from __future__ import annotations

import argparse
import sys
import time
from collections import deque
from pathlib import Path

import cv2

_root = Path(__file__).resolve().parents[1]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from src.capture.webcam import WebcamCapture
from src.processing.pose_estimator import PoseEstimator
from src.processing.pipeline import ProcessingPipeline
from src.analysis.angles import compute_joint_angles
from src.analysis.gait_metrics import compute_gait_metrics
from src.utils.config_loader import get_config
from src.utils.overlay import draw_fps, draw_angles, draw_gait_metrics

BUFFER_SIZE = 90
GAIT_INTERVAL = 15


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Runners - Analise biomecanica em tempo real")
    parser.add_argument("--camera", type=int, default=None, help="Indice da camera (default: config)")
    parser.add_argument("--width", type=int, default=None, help="Largura do frame (default: config)")
    parser.add_argument("--height", type=int, default=None, help="Altura do frame (default: config)")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = get_config()
    cam_config = config.get("camera", {})
    pose_config = config.get("pose", {})

    camera_index = args.camera if args.camera is not None else cam_config.get("camera_index", 0)
    width = args.width if args.width is not None else cam_config.get("width", 1280)
    height = args.height if args.height is not None else cam_config.get("height", 720)
    fps = cam_config.get("fps", 30)

    print(f"Iniciando captura: camera={camera_index}, {width}x{height}")
    print("Pressione Q para sair.\n")

    cam = WebcamCapture(camera_index=camera_index, width=width, height=height)
    if not cam.open():
        print("ERRO: Nao foi possivel abrir a webcam.")
        sys.exit(1)

    estimator = PoseEstimator(
        model_complexity=pose_config.get("model_complexity", 1),
        min_detection_confidence=pose_config.get("min_detection_confidence", 0.5),
        min_tracking_confidence=pose_config.get("min_tracking_confidence", 0.5),
        running_mode="video",
    )
    pipeline = ProcessingPipeline(pose_estimator=estimator, draw_landmarks=True)

    landmarks_buffer: deque[list[dict] | None] = deque(maxlen=BUFFER_SIZE)
    current_angles: dict[str, float] = {}
    current_gait: dict[str, float] = {}
    frame_count = 0
    prev_time = time.perf_counter()
    display_fps = 0.0

    try:
        for frame_bgr in cam.frames():
            annotated, landmarks = pipeline.process(frame_bgr)
            landmarks_buffer.append(landmarks)

            if landmarks is not None:
                current_angles = compute_joint_angles(landmarks)

            if frame_count % GAIT_INTERVAL == 0 and len(landmarks_buffer) >= 10:
                gait = compute_gait_metrics(list(landmarks_buffer), fps)
                if gait:
                    current_gait = gait

            now = time.perf_counter()
            elapsed = now - prev_time
            if elapsed > 0:
                display_fps = 1.0 / elapsed
            prev_time = now

            draw_fps(annotated, display_fps)
            draw_angles(annotated, current_angles)
            draw_gait_metrics(annotated, current_gait)

            cv2.imshow("Runners - Analise Biomecanica", annotated)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

            frame_count += 1

    except KeyboardInterrupt:
        print("\nInterrompido pelo usuario.")
    finally:
        cam.release()
        estimator.close()
        cv2.destroyAllWindows()
        print(f"Encerrado. {frame_count} frames processados.")


if __name__ == "__main__":
    main()
