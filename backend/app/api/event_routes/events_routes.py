# app/api/event.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.models.event import Event
from app.models.user import User
from app.schemas.event_schemas import EventCreate, EventResponse
from dependencies.db_dependency import get_db
from dependencies.role_dependency import require_organizer
from dependencies.get_user_dependency import get_current_user

router = APIRouter(prefix="/events", tags=["Events"])


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
    
    await db.delete(event)
    await db.commit()

    return {
        "message" : "Event deleted successfully"
    }

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