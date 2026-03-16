"""
App Streamlit para prototipagem: captura (webcam/arquivo) -> processamento -> análise -> métricas.
"""

import sys
from pathlib import Path

import streamlit as st
import cv2

# Raiz do projeto
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.capture import WebcamCapture, VideoFileCapture
from src.processing import ProcessingPipeline, PoseEstimator
from src.analysis import compute_joint_angles, compute_gait_metrics
from src.utils.config_loader import get_config

st.set_page_config(page_title="Runners - Biomecânica", layout="wide")
st.title("Monitoramento Biomecânico de Corrida")

config = get_config()
pose_config = config.get("pose", {})

# Fonte de vídeo
source = st.radio("Fonte de vídeo", ["Webcam", "Arquivo"], horizontal=True)
cap = None
video_path = None

if source == "Arquivo":
    data_videos = ROOT / "data" / "videos"
    data_videos.mkdir(parents=True, exist_ok=True)
    video_path = st.text_input("Caminho do vídeo", placeholder=str(data_videos / "exemplo.mp4"))
    if video_path and Path(video_path).exists():
        cap = VideoFileCapture(video_path)
    else:
        st.info(f"Coloque um vídeo em `data/videos/` ou informe o caminho. Ex.: {data_videos / 'run.mp4'}")
else:
    cap = WebcamCapture(
        camera_index=config.get("camera", {}).get("camera_index", 0),
        width=config.get("camera", {}).get("width"),
        height=config.get("camera", {}).get("height"),
    )

# Pipeline
estimator = PoseEstimator(
    model_complexity=pose_config.get("model_complexity", 1),
    min_detection_confidence=pose_config.get("min_detection_confidence", 0.5),
    min_tracking_confidence=pose_config.get("min_tracking_confidence", 0.5),
)
pipeline = ProcessingPipeline(pose_estimator=estimator, draw_landmarks=True)

st.subheader("Métricas (último frame ou vídeo processado)")

# Botão para processar um vídeo (arquivo) e mostrar métricas agregadas
if source == "Arquivo" and cap and video_path:
    if st.button("Processar vídeo e calcular métricas agregadas"):
        cap.open()
        landmarks_list = []
        frame_count = 0
        fps = 30.0
        with st.spinner("Processando frames..."):
            for frame in cap.frames():
                frame_count += 1
                annotated, landmarks = pipeline.process(frame)
                if landmarks:
                    landmarks_list.append(landmarks)
            cap.release()
        duration_s = frame_count / fps if fps else None
        gait = compute_gait_metrics(landmarks_list, fps, duration_s=duration_s)
        angles_last = compute_joint_angles(landmarks_list[-1]) if landmarks_list else {}
        st.success("Processamento concluído.")
        st.json({"angles_last_frame": angles_last, "gait": gait, "frames_processed": frame_count})

# Preview ao vivo (webcam): um frame
if source == "Webcam" and cap:
    if st.button("Capturar e analisar um frame"):
        if cap.open():
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None:
                annotated, landmarks = pipeline.process(frame)
                st.image(cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB), use_container_width=True)
                angles = compute_joint_angles(landmarks)
                st.metric("Ângulos (último frame)", str(angles))
                st.json(angles)
            else:
                st.error("Não foi possível ler o frame da webcam.")
        else:
            st.error("Não foi possível abrir a webcam.")

# Métricas stub na sidebar
with st.sidebar:
    st.subheader("Métricas de referência")
    st.metric("Cadência alvo (passos/min)", "160–190")
    st.metric("GCT típico (s)", "0.20–0.30")
    st.caption("Use a API para persistir sessões e métricas.")
