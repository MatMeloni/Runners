"""Testes unitários para métricas de marcha."""

import math

import pytest

from src.analysis.gait_metrics import (
    compute_gait_metrics,
    estimate_cadence,
    estimate_distance,
    estimate_ground_contact_time,
)
from tests.conftest import make_landmarks

FPS = 30.0


class TestGroundContactTime:
    def test_gct_returns_none_empty(self):
        """Sequência vazia retorna None."""
        assert estimate_ground_contact_time([], FPS) is None
        assert estimate_ground_contact_time([None, None], FPS) is None

    def test_gct_detects_contact(self):
        """Calcanhar no solo por 8 frames consecutivos → GCT entre 0.1 e 0.5."""
        sequence = []
        for i in range(30):
            lms = make_landmarks(33)
            if 5 <= i <= 12:
                lms[29]["y"] = 0.9  # left heel on ground
            if 15 <= i <= 22:
                lms[30]["y"] = 0.9  # right heel on ground
            sequence.append(lms)

        gct = estimate_ground_contact_time(sequence, FPS)
        assert gct is not None
        assert 0.1 <= gct <= 0.5


class TestCadence:
    def test_cadence_returns_none_short(self):
        """Poucos frames (< 4) retorna None."""
        seq = [make_landmarks(33) for _ in range(3)]
        assert estimate_cadence(seq, FPS) is None

    def test_cadence_detects_steps(self):
        """
        Oscilação senoidal de ankle y a ~3 Hz, 30 fps, 90 frames (~3s).
        Espera-se ~9 ciclos por pé × 2 pés = ~18 strikes → cadence ~360 spm.
        Com detecção de picos (maxima em y), aceita faixa ampla.
        """
        sequence = []
        freq = 3.0
        for i in range(90):
            lms = make_landmarks(33)
            t = i / FPS
            # Ankle oscila entre 0.4 e 0.8; picos em y = foot strike (coords normalizadas)
            lms[27]["y"] = 0.6 + 0.2 * math.sin(2 * math.pi * freq * t)
            lms[28]["y"] = 0.6 + 0.2 * math.sin(2 * math.pi * freq * t + math.pi)
            sequence.append(lms)

        cadence = estimate_cadence(sequence, FPS)
        assert cadence is not None
        assert 150 <= cadence <= 400


class TestDistance:
    def test_distance_formula(self):
        """cadence=180, duration=60s, stride=1.2m → 216.0m."""
        seq = [make_landmarks(33)]
        result = estimate_distance(
            seq, cadence_steps_per_min=180, duration_s=60, stride_length_m=1.2
        )
        assert result == 216.0

    def test_distance_returns_none_no_data(self):
        """Sem dados suficientes retorna None."""
        assert estimate_distance([]) is None


class TestComputeGaitMetrics:
    def test_returns_dict(self):
        """Sequência válida retorna dict com pelo menos uma chave de métrica."""
        sequence = []
        for i in range(90):
            lms = make_landmarks(33)
            t = i / FPS
            lms[27]["y"] = 0.6 + 0.2 * math.sin(2 * math.pi * 3 * t)
            lms[28]["y"] = 0.6 + 0.2 * math.sin(2 * math.pi * 3 * t + math.pi)
            lms[29]["y"] = 0.9 if (i % 20 < 8) else 0.3
            lms[30]["y"] = 0.9 if ((i + 10) % 20 < 8) else 0.3
            sequence.append(lms)

        result = compute_gait_metrics(sequence, FPS, duration_s=3.0)
        assert isinstance(result, dict)
        valid_keys = {"ground_contact_time_s", "cadence_steps_per_min", "distance_m"}
        assert len(valid_keys & set(result.keys())) >= 1
