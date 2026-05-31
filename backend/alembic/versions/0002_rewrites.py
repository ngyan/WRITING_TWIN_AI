"""rewrites table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-31

"""
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rewrites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("input_hash", sa.String(64), nullable=False),
        sa.Column("tone", sa.String(50), nullable=False),
        sa.Column("context_detected", sa.String(50), nullable=True),
        sa.Column("intent_detected", sa.String(50), nullable=True),
        sa.Column("output_text", sa.Text(), nullable=False),
        sa.Column("cache_hit", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("input_tokens", sa.Integer(), nullable=False),
        sa.Column("output_tokens", sa.Integer(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("cost_usd", sa.Float(), nullable=False),
        sa.Column("user_action", sa.String(20), nullable=True),
        sa.Column("user_edit_text", sa.Text(), nullable=True),
        sa.Column("feedback_thumb", sa.Integer(), nullable=True),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("score_human", sa.Float(), nullable=True),
        sa.Column("score_style_match", sa.Float(), nullable=True),
        sa.Column("score_readability", sa.Float(), nullable=True),
        sa.Column("score_confidence", sa.Float(), nullable=True),
        sa.Column("score_risk", sa.Float(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_rewrites_user_id", "rewrites", ["user_id"])
    op.create_index("ix_rewrites_input_hash", "rewrites", ["input_hash"])
    op.create_index("ix_rewrites_created_at", "rewrites", ["created_at"])


def downgrade() -> None:
    op.drop_table("rewrites")
