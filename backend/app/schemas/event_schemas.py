# app/schemas/event.py

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class EventCreate(BaseModel):
    name: str
    description: str | None = None
    password: str | None = None
    cover_image_url: str | None = None

class EventResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    password: str | None = None
    cover_image_url: str | None = None
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True