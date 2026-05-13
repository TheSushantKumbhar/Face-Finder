# app/api/event.py

from fastapi import APIRouter, Depends, HTTPException, Query as QueryParam
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
import uuid
from typing import Optional

from app.models.event import Event
from app.models.user import User
from app.models.photo import Photo
from app.schemas.event_schemas import EventCreate, EventResponse
from dependencies.db_dependency import get_db
from dependencies.role_dependency import require_organizer
from dependencies.get_user_dependency import get_current_user
from app.services.r2_cleanup import delete_event_with_r2_cleanup

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
        }
        for row in rows
    ]


# create events 
@router.post("/createEvent", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_organizer) 
):
    namespace = f"event_{uuid.uuid4()}"

    new_event = Event(
        name=event.name,
        description=event.description,
        password=event.password,
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