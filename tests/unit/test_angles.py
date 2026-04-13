"""Testes unitários para cálculo de ângulos articulares."""

import pytest

from src.analysis.angles import (
    compute_joint_angles,
    hip_angle,
    knee_angle,
    trunk_angle,
)
from tests.conftest import make_landmarks


def _set_landmark(landmarks: list[dict], idx: int, x: float, y: float) -> None:
    landmarks[idx]["x"] = x
    landmarks[idx]["y"] = y


class TestKneeAngle:
    def test_knee_angle_90_degrees(self):
        """Joelho a 90 graus: hip vertical, ankle horizontal em relação ao knee."""
        lms = make_landmarks(33)
        # left: hip=23, knee=25, ankle=27
        _set_landmark(lms, 23, 0.5, 0.3)   # hip acima
        _set_landmark(lms, 25, 0.5, 0.5)   # knee no centro
        _set_landmark(lms, 27, 0.7, 0.5)   # ankle à direita (perpendicular)
        result = knee_angle(lms, "left")
        assert result is not None
        assert abs(result - 90.0) < 1.0

    def test_knee_angle_straight(self):
        """Perna reta (~180 graus): hip, knee, ankle colineares verticalmente."""
        lms = make_landmarks(33)
        _set_landmark(lms, 23, 0.5, 0.3)
        _set_landmark(lms, 25, 0.5, 0.5)
        _set_landmark(lms, 27, 0.5, 0.7)
        result = knee_angle(lms, "left")
        assert result is not None
        assert result > 170.0


class TestHipAngle:
    def test_hip_angle_returns_float(self):
        """Hip angle com landmarks válidos retorna float."""
        lms = make_landmarks(33)
        _set_landmark(lms, 11, 0.5, 0.2)   # shoulder
        _set_landmark(lms, 23, 0.5, 0.5)   # hip
        _set_landmark(lms, 25, 0.5, 0.8)   # knee
        result = hip_angle(lms, "left")
        assert isinstance(result, float)


class TestTrunkAngle:
    def test_trunk_angle_upright(self):
        """Tronco perfeitamente vertical: ângulo próximo de 0."""
        lms = make_landmarks(33)
        # Ombros e quadris alinhados em x, diferença só em y
        _set_landmark(lms, 11, 0.5, 0.3)   # left shoulder
        _set_landmark(lms, 12, 0.5, 0.3)   # right shoulder
        _set_landmark(lms, 23, 0.5, 0.7)   # left hip
        _set_landmark(lms, 24, 0.5, 0.7)   # right hip
        result = trunk_angle(lms)
        assert result is not None
        assert result < 2.0


class TestComputeJointAngles:
    def test_missing_landmarks(self):
        """Lista vazia retorna dict vazio."""
        assert compute_joint_angles([]) == {}
        assert compute_joint_angles(None) == {}

    def test_full_landmarks(self):
        """33 landmarks válidos retorna dict com 5 chaves esperadas."""
        lms = make_landmarks(33)
        _set_landmark(lms, 11, 0.4, 0.2)
        _set_landmark(lms, 12, 0.6, 0.2)
        _set_landmark(lms, 23, 0.4, 0.5)
        _set_landmark(lms, 24, 0.6, 0.5)
        _set_landmark(lms, 25, 0.4, 0.7)
        _set_landmark(lms, 26, 0.6, 0.7)
        _set_landmark(lms, 27, 0.4, 0.9)
        _set_landmark(lms, 28, 0.6, 0.9)
        result = compute_joint_angles(lms)
        expected_keys = {"knee_left", "knee_right", "hip_left", "hip_right", "trunk"}
        assert expected_keys == set(result.keys())
