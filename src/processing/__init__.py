"""Pipeline de processamento de imagem e estimativa de pose."""

from src.processing.pose_estimator import PoseEstimator
from src.processing.pipeline import ProcessingPipeline

__all__ = ["PoseEstimator", "ProcessingPipeline"]
