"""writing profiles table

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "writing_profiles",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        # Quantitative DNA
        sa.Column("avg_sentence_length", sa.Float, nullable=True),
        sa.Column("avg_paragraph_length", sa.Float, nullable=True),
        sa.Column("formality_score", sa.Float, nullable=True),
        sa.Column("warmth_score", sa.Float, nullable=True),
        sa.Column("directness_score", sa.Float, nullable=True),
        # Qualitative DNA (JSONB)
        sa.Column("common_phrases", JSONB, nullable=True),
        sa.Column("greeting_styles", JSONB, nullable=True),
        sa.Column("signoff_styles", JSONB, nullable=True),
        sa.Column("vocabulary_preferences", JSONB, nullable=True),
        sa.Column("punctuation_habits", JSONB, nullable=True),
        # Job tracking
        sa.Column("sample_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("extraction_status", sa.String(20), nullable=False, server_default="pending"),
        # Meta
        sa.Column("last_refined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("qdrant_collection", sa.String(255), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_writing_profiles_user_id", "writing_profiles", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_writing_profiles_user_id", table_name="writing_profiles")
    op.drop_table("writing_profiles")
