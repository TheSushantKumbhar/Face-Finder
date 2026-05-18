"""add cover_image_url column to events table

Revision ID: b5e2d9f14c03
Revises: a3f1c8e92d01
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'b5e2d9f14c03'
down_revision = 'a3f1c8e92d01'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('events', sa.Column('cover_image_url', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('events', 'cover_image_url')
