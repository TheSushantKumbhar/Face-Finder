from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.db.base import Base

class UserRole(str, enum.Enum):
    user = "user"
    organizer = "organizer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id : Mapped[uuid.UUID] =  mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    username : Mapped[str]  = mapped_column(
        String,
        nullable=False
    )

    email : Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False
    )

    password : Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    role : Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.user,
        nullable=False
    )

    is_active : Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )