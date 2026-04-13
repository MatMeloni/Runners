"""Funcoes de overlay para desenhar metricas biomecanicas sobre frames OpenCV."""

import cv2
import numpy as np

FONT = cv2.FONT_HERSHEY_SIMPLEX
FONT_SCALE = 0.5
FONT_THICKNESS = 1
LINE_HEIGHT = 22


def draw_text_with_bg(
    frame: np.ndarray,
    text: str,
    pos: tuple[int, int],
    color: tuple[int, int, int] = (255, 255, 255),
    bg_alpha: float = 0.6,
) -> None:
    """Desenha texto com fundo semi-transparente para legibilidade."""
    (tw, th), baseline = cv2.getTextSize(text, FONT, FONT_SCALE, FONT_THICKNESS)
    x, y = pos
    pad = 4
    x1, y1 = x - pad, y - th - pad
    x2, y2 = x + tw + pad, y + baseline + pad

    x1, y1 = max(0, x1), max(0, y1)
    x2 = min(frame.shape[1], x2)
    y2 = min(frame.shape[0], y2)

    overlay = frame[y1:y2, x1:x2].copy()
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 0), -1)
    frame[y1:y2, x1:x2] = cv2.addWeighted(
        overlay, 1 - bg_alpha, frame[y1:y2, x1:x2], bg_alpha, 0
    )
    cv2.putText(frame, text, (x, y), FONT, FONT_SCALE, color, FONT_THICKNESS, cv2.LINE_AA)


def draw_fps(frame: np.ndarray, fps: float) -> None:
    """Desenha contador de FPS no canto superior esquerdo."""
    draw_text_with_bg(frame, f"FPS: {fps:.0f}", (10, 25), color=(0, 255, 255))


def draw_angles(frame: np.ndarray, angles: dict[str, float]) -> None:
    """Desenha angulos articulares no canto superior direito."""
    if not angles:
        return
    w = frame.shape[1]
    labels = [
        ("Joelho E", "knee_left"),
        ("Joelho D", "knee_right"),
        ("Quadril E", "hip_left"),
        ("Quadril D", "hip_right"),
        ("Tronco", "trunk"),
    ]
    y = 25
    for label, key in labels:
        val = angles.get(key)
        if val is None:
            continue
        text = f"{label}: {val:.1f}"
        (tw, _), _ = cv2.getTextSize(text, FONT, FONT_SCALE, FONT_THICKNESS)
        x = w - tw - 15
        draw_text_with_bg(frame, text, (x, y), color=(0, 255, 0))
        y += LINE_HEIGHT


def draw_gait_metrics(frame: np.ndarray, gait: dict[str, float]) -> None:
    """Desenha metricas de marcha no canto inferior esquerdo."""
    if not gait:
        return
    h = frame.shape[0]
    labels = [
        ("GCT", "ground_contact_time_s", "s"),
        ("Cadencia", "cadence_steps_per_min", "ppm"),
        ("Distancia", "distance_m", "m"),
    ]
    items = []
    for label, key, unit in labels:
        val = gait.get(key)
        if val is not None:
            items.append(f"{label}: {val:.2f} {unit}")

    if not items:
        return

    y = h - 15 - (len(items) - 1) * LINE_HEIGHT
    for text in items:
        draw_text_with_bg(frame, text, (10, y), color=(255, 200, 0))
        y += LINE_HEIGHT
