# models/upload.py

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime
from datetime import datetime
import uuid

from app.db.base import Base


class Upload(Base):
    __tablename__ = "uploads"

    upload_id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(nullable=True)

    file_key: Mapped[str] = mapped_column(nullable=False)
    r2_upload_id: Mapped[str] = mapped_column(nullable=False)

    status: Mapped[str] = mapped_column(default="in_progress")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)