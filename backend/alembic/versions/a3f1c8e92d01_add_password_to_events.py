"""add password column to events table

Revision ID: a3f1c8e92d01
Revises: 77609445329e
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'a3f1c8e92d01'
down_revision = '77609445329e'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('events', sa.Column('password', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('events', 'password')
