"""add_status_video_error_to_sessions_and_analysis_results

Revision ID: 3c58fd5f583c
Revises: 
Create Date: 2026-04-13 18:19:17.326984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '3c58fd5f583c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    session_columns = {col["name"] for col in inspector.get_columns("sessions")}
    if "status" not in session_columns:
        op.add_column(
            "sessions",
            sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        )
    if "video_path" not in session_columns:
        op.add_column("sessions", sa.Column("video_path", sa.Text(), nullable=True))
    if "error_msg" not in session_columns:
        op.add_column("sessions", sa.Column("error_msg", sa.Text(), nullable=True))

    if not inspector.has_table("analysis_results"):
        op.create_table(
            "analysis_results",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("frame_index", sa.Integer(), nullable=False),
            sa.Column("timestamp_s", sa.Float(), nullable=True),
            sa.Column("angles", JSONB(), nullable=True),
            sa.Column("ground_contact_time_s", sa.Float(), nullable=True),
            sa.Column("cadence_steps_per_min", sa.Float(), nullable=True),
            sa.Column("distance_m", sa.Float(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("analysis_results"):
        op.drop_table("analysis_results")

    session_columns = {col["name"] for col in inspector.get_columns("sessions")}
    if "error_msg" in session_columns:
        op.drop_column("sessions", "error_msg")
    if "video_path" in session_columns:
        op.drop_column("sessions", "video_path")
    if "status" in session_columns:
        op.drop_column("sessions", "status")
