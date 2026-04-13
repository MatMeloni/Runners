"""
Constantes do projeto: índices de landmarks MediaPipe e nomes de métricas.

Referência MediaPipe Pose: 33 landmarks (0-32).
https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
"""

# Índices MediaPipe Pose (membros inferiores e tronco)
POSE_LANDMARKS = {
    "nose": 0,
    "left_eye_inner": 1,
    "left_eye": 2,
    "left_eye_outer": 3,
    "right_eye_inner": 4,
    "right_eye": 5,
    "right_eye_outer": 6,
    "left_ear": 7,
    "right_ear": 8,
    "mouth_left": 9,
    "mouth_right": 10,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_pinky": 17,
    "right_pinky": 18,
    "left_index": 19,
    "right_index": 20,
    "left_thumb": 21,
    "right_thumb": 22,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28,
    "left_heel": 29,
    "right_heel": 30,
    "left_foot_index": 31,
    "right_foot_index": 32,
}

# Aliases para análise de corrida
LANDMARK_HIP_LEFT = 23
LANDMARK_HIP_RIGHT = 24
LANDMARK_KNEE_LEFT = 25
LANDMARK_KNEE_RIGHT = 26
LANDMARK_ANKLE_LEFT = 27
LANDMARK_ANKLE_RIGHT = 28
LANDMARK_SHOULDER_LEFT = 11
LANDMARK_SHOULDER_RIGHT = 12
LANDMARK_HEEL_LEFT = 29
LANDMARK_HEEL_RIGHT = 30
LANDMARK_FOOT_INDEX_LEFT = 31
LANDMARK_FOOT_INDEX_RIGHT = 32

# Nomes das métricas expostas
METRIC_ANGLES = "angles"
METRIC_CADENCE = "cadence"
METRIC_GROUND_CONTACT_TIME = "ground_contact_time"
METRIC_DISTANCE = "distance"

DEFAULT_CADENCE_MIN = 160  # passos/min (referência)
DEFAULT_CADENCE_MAX = 190
