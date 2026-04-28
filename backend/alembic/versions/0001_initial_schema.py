"""initial schema - all tables

Revision ID: 0001_initial
Revises: 
Create Date: 2026-04-28
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Enable UUID generation
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # ── ENUM types (raw SQL — works with async) ──
    op.execute("DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'organizer', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE photo_status AS ENUM ('pending', 'processed', 'failed', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE selfie_type AS ENUM ('front', 'left', 'right'); EXCEPTION WHEN duplicate_object THEN null; END $$")

    user_role_enum = postgresql.ENUM('user', 'organizer', 'admin', name='user_role', create_type=False)
    photo_status_enum = postgresql.ENUM('pending', 'processed', 'failed', 'completed', name='photo_status', create_type=False)
    selfie_type_enum = postgresql.ENUM('front', 'left', 'right', name='selfie_type', create_type=False)

    # ── USERS ──
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('role', user_role_enum, nullable=False, server_default='user'),
        sa.Column('profile_photo_url', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # ── EVENTS ──
    op.create_table(
        'events',
        sa.Column('id', sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('pinecone_namespace', sa.String(), nullable=False, unique=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
    )
    op.create_index('idx_event_created_by', 'events', ['created_by'])

    # ── PHOTOS ──
    op.create_table(
        'photos',
        sa.Column('id', sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('event_id', sa.UUID(), nullable=False),
        sa.Column('uploaded_by', sa.UUID(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('status', photo_status_enum, nullable=False, server_default='pending'),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['event_id'], ['events.id']),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id']),
    )
    op.create_index('idx_photo_event_id', 'photos', ['event_id'])

    # ── UPLOADS ──
    op.create_table(
        'uploads',
        sa.Column('upload_id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('event_id', sa.UUID(), nullable=True),
        sa.Column('file_key', sa.String(), nullable=False),
        sa.Column('r2_upload_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='in_progress'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
    )

    # ── UPLOAD PARTS ──
    op.create_table(
        'upload_parts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('upload_id', sa.String(), nullable=False),
        sa.Column('part_number', sa.Integer(), nullable=False),
        sa.Column('etag', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['upload_id'], ['uploads.upload_id']),
    )

    # ── USER SELFIES ──
    op.create_table(
        'user_selfies',
        sa.Column('id', sa.UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('selfie_type', selfie_type_enum, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('user_id', 'selfie_type', name='unique_user_selfie_type'),
    )


def downgrade():
    op.drop_table('user_selfies')
    op.drop_table('upload_parts')
    op.drop_table('uploads')
    op.drop_index('idx_photo_event_id', table_name='photos')
    op.drop_table('photos')
    op.drop_index('idx_event_created_by', table_name='events')
    op.drop_table('events')
    op.drop_table('users')

    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS selfie_type")
    op.execute("DROP TYPE IF EXISTS photo_status")
    op.execute("DROP TYPE IF EXISTS user_role")
