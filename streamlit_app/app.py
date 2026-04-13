"""
App Streamlit — captura ao vivo (webcam) e processamento de arquivo,
com esqueleto, angulos e metricas de marcha em tempo real.
"""

import sys
import time
from collections import deque
from pathlib import Path

import cv2
import streamlit as st

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.capture import WebcamCapture, VideoFileCapture
from src.processing import ProcessingPipeline, PoseEstimator
from src.analysis import compute_joint_angles, compute_gait_metrics
from src.utils.config_loader import get_config
from src.utils.overlay import draw_fps, draw_angles, draw_gait_metrics

BUFFER_SIZE = 90
GAIT_INTERVAL = 15

st.set_page_config(page_title="Runners - Biomecanica", layout="wide")
st.title("Monitoramento Biomecanico de Corrida")

config = get_config()
cam_config = config.get("camera", {})
pose_config = config.get("pose", {})

if "capturing" not in st.session_state:
    st.session_state.capturing = False

source = st.radio("Fonte de video", ["Webcam", "Arquivo"], horizontal=True)

# ─── Modo Arquivo (mantido para uso futuro) ───────────────────────────────────
if source == "Arquivo":
    data_videos = ROOT / "data" / "videos"
    data_videos.mkdir(parents=True, exist_ok=True)
    video_path = st.text_input(
        "Caminho do video",
        placeholder=str(data_videos / "exemplo.mp4"),
    )

    if video_path and Path(video_path).exists():
        if st.button("Processar video e calcular metricas"):
            cap = VideoFileCapture(video_path)
            estimator = PoseEstimator(
                model_complexity=pose_config.get("model_complexity", 1),
                min_detection_confidence=pose_config.get("min_detection_confidence", 0.5),
                min_tracking_confidence=pose_config.get("min_tracking_confidence", 0.5),
                running_mode="video",
            )
            pipeline = ProcessingPipeline(pose_estimator=estimator, draw_landmarks=True)
            cap.open()
            landmarks_list: list = []
            frame_count = 0
            fps = 30.0
            with st.spinner("Processando frames..."):
                for frame in cap.frames():
                    frame_count += 1
                    _, landmarks = pipeline.process(frame)
                    if landmarks:
                        landmarks_list.append(landmarks)
                cap.release()
            estimator.close()
            duration_s = frame_count / fps if fps else None
            gait = compute_gait_metrics(landmarks_list, fps, duration_s=duration_s)
            angles_last = compute_joint_angles(landmarks_list[-1]) if landmarks_list else {}
            st.success(f"Concluido — {frame_count} frames processados.")
            st.json({"angles_last_frame": angles_last, "gait": gait})
    else:
        st.info("Coloque um video em `data/videos/` ou informe o caminho.")

# ─── Modo Webcam — captura ao vivo ────────────────────────────────────────────
if source == "Webcam":

    col_start, col_stop = st.columns(2)
    with col_start:
        start_btn = st.button("Iniciar captura ao vivo", type="primary")
    with col_stop:
        stop_btn = st.button("Parar captura")

    if stop_btn:
        st.session_state.capturing = False

    if start_btn:
        st.session_state.capturing = True

    # --- Sidebar: metricas ao vivo ---
    with st.sidebar:
        st.subheader("Angulos articulares")
        sb_knee_l = st.empty()
        sb_knee_r = st.empty()
        sb_hip_l = st.empty()
        sb_hip_r = st.empty()
        sb_trunk = st.empty()

        st.divider()
        st.subheader("Metricas de marcha")
        sb_gct = st.empty()
        sb_cadence = st.empty()
        sb_distance = st.empty()

        st.divider()
        st.subheader("Referencia")
        st.caption("Cadencia alvo: 160–190 ppm")
        st.caption("GCT tipico: 0.20–0.30 s")

    # --- Area principal: feed de video ---
    frame_placeholder = st.empty()
    status_placeholder = st.empty()

    if st.session_state.capturing:
        cam = WebcamCapture(
            camera_index=cam_config.get("camera_index", 0),
            width=cam_config.get("width", 1280),
            height=cam_config.get("height", 720),
        )

        if not cam.open():
            st.error("Nao foi possivel abrir a webcam.")
            st.session_state.capturing = False
        else:
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
            fps = cam_config.get("fps", 30)
            prev_time = time.perf_counter()
            display_fps = 0.0

            try:
                while st.session_state.capturing:
                    ret, frame_bgr = cam.read()
                    if not ret or frame_bgr is None:
                        st.warning("Webcam desconectada.")
                        break

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

                    rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
                    frame_placeholder.image(rgb, channels="RGB", use_container_width=True)

                    sb_knee_l.metric("Joelho E", f"{current_angles.get('knee_left', 0):.1f} graus")
                    sb_knee_r.metric("Joelho D", f"{current_angles.get('knee_right', 0):.1f} graus")
                    sb_hip_l.metric("Quadril E", f"{current_angles.get('hip_left', 0):.1f} graus")
                    sb_hip_r.metric("Quadril D", f"{current_angles.get('hip_right', 0):.1f} graus")
                    sb_trunk.metric("Tronco", f"{current_angles.get('trunk', 0):.1f} graus")

                    gct_val = current_gait.get("ground_contact_time_s")
                    cad_val = current_gait.get("cadence_steps_per_min")
                    dist_val = current_gait.get("distance_m")
                    sb_gct.metric("GCT", f"{gct_val:.3f} s" if gct_val else "—")
                    sb_cadence.metric("Cadencia", f"{cad_val:.1f} ppm" if cad_val else "—")
                    sb_distance.metric("Distancia", f"{dist_val:.2f} m" if dist_val else "—")

                    status_placeholder.caption(
                        f"FPS: {display_fps:.0f}  |  Frames: {frame_count}"
                    )

                    frame_count += 1

            finally:
                cam.release()
                estimator.close()
                status_placeholder.success(
                    f"Captura encerrada — {frame_count} frames processados."
                )

    elif not st.session_state.capturing and source == "Webcam":
        frame_placeholder.info(
            "Clique em **Iniciar captura ao vivo** para comecar a analise em tempo real."
        )
