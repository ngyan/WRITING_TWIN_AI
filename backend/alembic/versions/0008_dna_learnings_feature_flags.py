"""dna_learnings and feature_flags tables

Revision ID: 0008
Revises: 0007
Create Date: 2025-01-01 00:00:01.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'dna_learnings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rewrite_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('tone', sa.String(50), nullable=False),
        sa.Column('phrases_added', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False),
        sa.Column('phrases_removed', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False),
        sa.Column('formality_delta', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['rewrite_id'], ['rewrites.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_dna_learnings_user_id', 'dna_learnings', ['user_id'])
    op.create_index('ix_dna_learnings_created_at', 'dna_learnings', ['created_at'])

    op.create_table(
        'feature_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('enabled', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', name='ix_feature_flags_name'),
    )


def downgrade() -> None:
    op.drop_table('feature_flags')
    op.drop_table('dna_learnings')
