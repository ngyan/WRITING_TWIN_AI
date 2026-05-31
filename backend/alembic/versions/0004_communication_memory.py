"""communication memory + user locale

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("locale", sa.String(20), nullable=False, server_default="en-US"),
    )

    op.create_table(
        "communication_memory",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "rewrite_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("rewrites.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("memory_type", sa.String(20), nullable=False),
        sa.Column("final_text", sa.Text, nullable=False),
        sa.Column("original_output", sa.Text, nullable=True),
        sa.Column("tone", sa.String(50), nullable=False),
        sa.Column("context", sa.String(50), nullable=True),
        sa.Column("edit_distance", sa.Float, nullable=True),
        sa.Column("qdrant_point_id", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_communication_memory_user_id", "communication_memory", ["user_id"])
    op.create_index("ix_communication_memory_created_at", "communication_memory", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_communication_memory_created_at", table_name="communication_memory")
    op.drop_index("ix_communication_memory_user_id", table_name="communication_memory")
    op.drop_table("communication_memory")
    op.drop_column("users", "locale")
