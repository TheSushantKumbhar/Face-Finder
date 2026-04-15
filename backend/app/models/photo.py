from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Index, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.db.base import Base


class PhotoStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    failed = "failed"


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id"),
        nullable=False
    )

    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )

    image_url: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    status: Mapped[PhotoStatus] = mapped_column(
        Enum(PhotoStatus, name="photo_status"),
        default=PhotoStatus.pending,
        nullable=False
    )

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    # relationships
    event = relationship("Event", back_populates="photos")
    uploader = relationship("User")

    __table_args__ = (
        Index("idx_photo_event_id", "event_id"),
    )