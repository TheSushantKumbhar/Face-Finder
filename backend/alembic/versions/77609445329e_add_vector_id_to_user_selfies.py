"""add_vector_id_to_user_selfies

Revision ID: 77609445329e
Revises: 57f0f469091b
Create Date: 2026-05-07 19:19:16.084809

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '77609445329e'
down_revision = '57f0f469091b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user_selfies', sa.Column('vector_id', sa.String(), nullable=True))


def downgrade():
    op.drop_column('user_selfies', 'vector_id')
