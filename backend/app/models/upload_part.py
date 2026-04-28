# models/upload_part.py

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, ForeignKey
from app.db.base import Base


class UploadPart(Base):
    __tablename__ = "upload_parts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    upload_id: Mapped[str] = mapped_column(
        ForeignKey("uploads.upload_id", ondelete="CASCADE")
    )

    part_number: Mapped[int] = mapped_column()
    etag: Mapped[str] = mapped_column()