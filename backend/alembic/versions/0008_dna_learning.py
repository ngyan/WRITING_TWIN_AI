"""dna learning engine — dna_learnings table + cringe_phrases on writing_profiles

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-02
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dna_learnings",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "rewrite_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("rewrites.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("tone", sa.String(50), nullable=False),
        sa.Column("phrases_added", ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("phrases_removed", ARRAY(sa.String), nullable=False, server_default="{}"),
        sa.Column("formality_delta", sa.Float, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
            index=True,
        ),
    )
    op.add_column(
        "writing_profiles",
        sa.Column("cringe_phrases", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("writing_profiles", "cringe_phrases")
    op.drop_table("dna_learnings")
