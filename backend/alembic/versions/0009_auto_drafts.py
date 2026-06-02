"""auto draft engine — auto_drafts table

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-02
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auto_drafts",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("incoming_text_hash", sa.String(64), nullable=False, index=True),
        sa.Column("draft", sa.Text, nullable=False),
        sa.Column("tone", sa.String(50), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("input_tokens", sa.Integer, server_default="0", nullable=False),
        sa.Column("output_tokens", sa.Integer, server_default="0", nullable=False),
        sa.Column("latency_ms", sa.Integer, server_default="0", nullable=False),
        sa.Column("cost_usd", sa.Float, server_default="0", nullable=False),
        sa.Column("kept", sa.Boolean, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
            index=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("auto_drafts")
