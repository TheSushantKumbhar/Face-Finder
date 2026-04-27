"""add completed to photo_status enum

Revision ID: 099e8cd3d3b0
Revises: f3b01e62fcee
Create Date: 2026-04-27 14:50:30.690031

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '099e8cd3d3b0'
down_revision = 'f3b01e62fcee'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("COMMIT")
    op.execute("ALTER TYPE photo_status ADD VALUE 'completed'")


def downgrade():
    pass
