# app/api/admin_panel/events.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from uuid import UUID

from dependencies.db_dependency import get_db
from dependencies.get_admin_dependency import get_current_admin

from app.models.user import User
from app.models.event import Event
from app.models.photo import Photo
from app.models.upload import Upload

router = APIRouter(
    prefix="/admin/events",
    tags=["Admin Events"]
)


# ---------------------------------------------------
# GET ALL EVENTS
# ---------------------------------------------------

@router.get("")
async def get_all_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    query = select(Event)

    count_query = select(func.count()).select_from(Event)

    if search:
        search_filter = or_(
            Event.name.ilike(f"%{search}%"),
            Event.description.ilike(f"%{search}%")
        )

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    query = (
        query
        .order_by(Event.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    events = result.scalars().all()

    total = await db.scalar(count_query)

    event_data = []

    for event in events:

        total_photos = await db.scalar(
            select(func.count()).select_from(Photo).where(
                Photo.event_id == event.id
            )
        )

        total_uploads = await db.scalar(
            select(func.count()).select_from(Upload).where(
                Upload.event_id == event.id
            )
        )

        event_data.append({
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "cover_image_url": event.cover_image_url,
            "created_by": str(event.created_by),
            "created_at": event.created_at,
            "total_photos": total_photos or 0,
            "total_uploads": total_uploads or 0,
        })

    return {
        "success": True,
        "data": event_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total or 0,
        }
    }


# ---------------------------------------------------
# GET EVENT DETAILS
# ---------------------------------------------------

@router.get("/{event_id}")
async def get_event_details(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Event).where(
            Event.id == event_id
        )
    )

    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    total_photos = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.event_id == event.id
        )
    )

    total_uploads = await db.scalar(
        select(func.count()).select_from(Upload).where(
            Upload.event_id == event.id
        )
    )

    return {
        "success": True,
        "data": {
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "cover_image_url": event.cover_image_url,
            "created_by": str(event.created_by),
            "created_at": event.created_at,
            "pinecone_namespace": event.pinecone_namespace,
            "total_photos": total_photos or 0,
            "total_uploads": total_uploads or 0,
        }
    }


# ---------------------------------------------------
# GET EVENT PHOTOS
# ---------------------------------------------------

@router.get("/{event_id}/photos")
async def get_event_photos(
    event_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    query = (
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    photos = result.scalars().all()

    total = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.event_id == event_id
        )
    )

    return {
        "success": True,
        "data": [
            {
                "id": str(photo.id),
                "image_url": photo.image_url,
                "status": photo.status.value,
                "uploaded_by": str(photo.uploaded_by) if photo.uploaded_by else None,
                "uploaded_at": photo.uploaded_at,
            }
            for photo in photos
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total or 0,
        }
    }


# ---------------------------------------------------
# GET EVENT UPLOADS
# ---------------------------------------------------

@router.get("/{event_id}/uploads")
async def get_event_uploads(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Upload)
        .where(Upload.event_id == event_id)
        .order_by(Upload.created_at.desc())
    )

    uploads = result.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "upload_id": upload.upload_id,
                "user_id": upload.user_id,
                "file_key": upload.file_key,
                "status": upload.status,
                "created_at": upload.created_at,
            }
            for upload in uploads
        ]
    }


# ---------------------------------------------------
# DELETE EVENT
# ---------------------------------------------------

@router.delete("/{event_id}")
async def delete_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Event).where(
            Event.id == event_id
        )
    )

    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    await db.delete(event)
    await db.commit()

    return {
        "success": True,
        "message": "Event deleted successfully"
    }