# app/api/event.py

from fastapi import APIRouter, Depends, HTTPException, Query as QueryParam, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from fastapi.concurrency import run_in_threadpool
import uuid
import io
from typing import Optional

from app.models.event import Event
from app.models.user import User
from app.models.photo import Photo
from app.schemas.event_schemas import EventCreate, EventResponse
from dependencies.db_dependency import get_db
from dependencies.role_dependency import require_organizer
from dependencies.get_user_dependency import get_current_user
from app.services.r2_cleanup import delete_event_with_r2_cleanup
from app.services.storage_service import r2, R2_BUCKET_NAME

R2_PUBLIC_URL_PREFIX = "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev"

# Allowed image content types for cover image validation
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_COVER_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

router = APIRouter(prefix="/events", tags=["Events"])


# ── Discover / Search all events ─────────────────────────
@router.get("/discover")
async def discover_events(
    q: Optional[str] = QueryParam(None, description="Search query"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all events (across all organisers) with organiser name
    and photo count. Supports optional search by event name or description.
    Results ordered by most recent first.
    """
    # Build subquery for photo count
    photo_count_sq = (
        select(
            Photo.event_id,
            func.count(Photo.id).label("photo_count"),
        )
        .group_by(Photo.event_id)
        .subquery()
    )

    # Main query: join event → creator, left join photo counts
    stmt = (
        select(
            Event.id,
            Event.name,
            Event.description,
            Event.password,
            Event.cover_image_url,
            Event.created_by,
            Event.created_at,
            User.username.label("organiser_name"),
            func.coalesce(photo_count_sq.c.photo_count, 0).label("photo_count"),
        )
        .join(User, Event.created_by == User.id)
        .outerjoin(photo_count_sq, Event.id == photo_count_sq.c.event_id)
    )

    # Apply search filter
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Event.name.ilike(pattern),
                Event.description.ilike(pattern),
            )
        )

    stmt = stmt.order_by(Event.created_at.desc())

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "id": str(row.id),
            "name": row.name,
            "description": row.description,
            "created_by": str(row.created_by),
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "organiser_name": row.organiser_name,
            "photo_count": row.photo_count,
            "is_password_protected": row.password is not None and len(row.password) > 0,
            "cover_image_url": row.cover_image_url,
        }
        for row in rows
    ]


# ── Verify event password ─────────────────────────────────
from pydantic import BaseModel as PydanticBase

class PasswordVerifyRequest(PydanticBase):
    password: str

@router.post("/{event_id}/verify-password")
async def verify_event_password(
    event_id: uuid.UUID,
    body: PasswordVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify the password for a password-protected event.
    Returns 200 on success, 401 on wrong password.
    Non-protected events return 400 (no password set).
    """
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not event.password:
        raise HTTPException(status_code=400, detail="This event is not password protected")

    if event.password != body.password:
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    return {"success": True, "message": "Password verified successfully"}


# create events 
@router.post("/createEvent", response_model=EventResponse)
async def create_event(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    cover_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer) 
):
    namespace = f"event_{uuid.uuid4()}"

    # Handle cover image upload to R2
    cover_image_url = None
    if cover_image is not None:
        content_type = cover_image.content_type or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image type '{content_type}'. Allowed: JPEG, PNG, WebP, GIF"
            )

        file_bytes = await cover_image.read()

        if len(file_bytes) > MAX_COVER_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Cover image must be under 10 MB"
            )

        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Cover image file is empty"
            )

        ext = cover_image.filename.rsplit(".", 1)[-1].lower() if cover_image.filename else "jpg"
        event_uuid = uuid.uuid4()
        key = f"event-covers/{event_uuid}/cover.{ext}"

        try:
            await run_in_threadpool(
                r2.upload_fileobj,
                io.BytesIO(file_bytes),
                R2_BUCKET_NAME,
                key,
                ExtraArgs={"ContentType": content_type},
            )
            cover_image_url = f"{R2_PUBLIC_URL_PREFIX}/{key}"
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload cover image: {str(e)}"
            )

    new_event = Event(
        name=name,
        description=description,
        password=password,
        cover_image_url=cover_image_url,
        created_by=current_user.id,
        pinecone_namespace=namespace
    )

    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)

    return new_event

# get all events (normal user)
@router.get("/", response_model=list[EventResponse])
async def get_events(
    db : AsyncSession = Depends(get_db),
    current_user : User = Depends(get_current_user)
):
    result = await db.execute(select(Event).where(Event.created_by == current_user.id))

    events = result.scalars().all()
    return events


#update event 
@router.put("/{event_id}",response_model=EventResponse)
async def update_event(
    event_id : uuid.UUID,
    update_data : EventCreate,
    db : AsyncSession = Depends(get_db),
    current_user : User = Depends(require_organizer)
) : 
    
    result = await db.execute(select(Event).where(Event.id == event_id))

    event = result.scalar_one_or_none()

    if not event : 
        raise HTTPException(status_code=404, detail="Event not foun")
    
    if event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized")
    
    event.name = update_data.name
    event.description = update_data.description

    await db.commit()
    await db.refresh(event)

    return event


@router.delete("/{event_id}")
async def delete_event(
    event_id : uuid.UUID,
    db : AsyncSession = Depends(get_db),
    current_user : User = Depends(require_organizer)
)  : 
    
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()

    if not event: 
        raise HTTPException(status_code=404, detail="event not found")
    
    if event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="not authorized")
    
    try:
        summary = await delete_event_with_r2_cleanup(db, event)
        return summary
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete event: {str(e)}"
        )

# get event photos
from app.models.photo import Photo
@router.get("/{event_id}/photos")
async def get_event_photos(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user has access or is organizer. For now just fetch.
    result = await db.execute(select(Photo).where(Photo.event_id == event_id))
    photos = result.scalars().all()
    
    return [
        {
            "id": str(photo.id),
            "event_id": str(photo.event_id),
            "image_url": photo.image_url,
            "status": photo.status.value if hasattr(photo.status, 'value') else photo.status,
            "uploaded_by": str(photo.uploaded_by),
            "created_at": photo.uploaded_at.isoformat() if photo.uploaded_at else None
        }
        for photo in photos
    ]


# ── Reprocess a failed photo ─────────────────────────────
from app.config import ROUTING_KEY_FACE
from app.services.producer import Producer

@router.post("/{event_id}/photos/{photo_id}/reprocess")
async def reprocess_photo(
    event_id: uuid.UUID,
    photo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Re-trigger face processing for a photo that previously failed.
    Resets its status back to 'pending' and re-publishes the message
    to the face-processing queue.
    """
    from app.models.photo import PhotoStatus

    result = await db.execute(
        select(Photo).where(Photo.id == photo_id, Photo.event_id == event_id)
    )
    photo = result.scalar_one_or_none()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    if photo.status != PhotoStatus.failed:
        raise HTTPException(
            status_code=400,
            detail="Only failed photos can be reprocessed",
        )

    # Reset status
    photo.status = PhotoStatus.pending
    await db.commit()

    # Re-publish to face-processing queue
    face_processing_msg = {
        "eventID": str(event_id),
        "photoID": str(photo_id),
        "r2URL": photo.image_url,
    }

    producer = Producer()
    producer.publish(routing_key=ROUTING_KEY_FACE, msg=face_processing_msg)
    producer.close()

    return {"message": "Photo queued for reprocessing", "photo_id": str(photo_id)}