"""context engine — customer_domains on users + context_overrides table

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-02
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "customer_domains",
            ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
    )

    op.create_table(
        "context_overrides",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            PG_UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("detected_context", sa.String(50), nullable=False),
        sa.Column("selected_context", sa.String(50), nullable=False),
        sa.Column("platform", sa.String(50), nullable=True),
        sa.Column("recipient_domain", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            index=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("context_overrides")
    op.drop_column("users", "customer_domains")
