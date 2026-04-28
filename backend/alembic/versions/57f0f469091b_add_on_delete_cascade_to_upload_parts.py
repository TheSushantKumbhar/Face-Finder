"""Add ON DELETE CASCADE to upload_parts

Revision ID: 57f0f469091b
Revises: 0001_initial
Create Date: 2026-04-28 01:00:51.741468

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '57f0f469091b'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint('upload_parts_upload_id_fkey', 'upload_parts', type_='foreignkey')
    op.create_foreign_key(
        'upload_parts_upload_id_fkey',
        'upload_parts', 'uploads',
        ['upload_id'], ['upload_id'],
        ondelete='CASCADE'
    )


def downgrade():
    op.drop_constraint('upload_parts_upload_id_fkey', 'upload_parts', type_='foreignkey')
    op.create_foreign_key(
        'upload_parts_upload_id_fkey',
        'upload_parts', 'uploads',
        ['upload_id'], ['upload_id']
    )
