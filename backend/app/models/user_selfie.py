from sqlalchemy import String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint
from datetime import datetime
import uuid
import enum

from app.db.base import Base

class SelfieType(str, enum.Enum):
    front = "front"
    left = "left"
    right = "right"

class UserSelfie(Base):
    __tablename__ = "user_selfies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    image_url: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    selfie_type: Mapped[SelfieType] = mapped_column(
        Enum(SelfieType, name="selfie_type"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User", back_populates="selfies")

    __table_args__ = (
        UniqueConstraint("user_id", "selfie_type", name="unique_user_selfie_type"),
    )