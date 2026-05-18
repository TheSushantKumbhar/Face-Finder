# app/api/admin_panel/organizers.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from uuid import UUID

from dependencies.db_dependency import get_db
from dependencies.get_admin_dependency import get_current_admin 

from app.models.user import User, UserRole
from app.models.event import Event
from app.models.photo import Photo

router = APIRouter(
    prefix="/admin/organizers",
    tags=["Admin Organizers"]
)


# ---------------------------------------------------
# GET ALL ORGANIZERS
# ---------------------------------------------------

@router.get("")
async def get_all_organizers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    query = select(User).where(
        User.role == UserRole.organizer
    )

    count_query = select(func.count()).select_from(User).where(
        User.role == UserRole.organizer
    )

    if search:
        search_filter = or_(
            User.username.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    organizers = result.scalars().all()

    total = await db.scalar(count_query)

    return {
        "success": True,
        "data": [
            {
                "id": str(organizer.id),
                "username": organizer.username,
                "email": organizer.email,
                "profile_photo_url": organizer.profile_photo_url,
                "is_active": organizer.is_active,
                "created_at": organizer.created_at,
            }
            for organizer in organizers
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total or 0
        }
    }


# ---------------------------------------------------
# GET SINGLE ORGANIZER
# ---------------------------------------------------

@router.get("/{organizer_id}")
async def get_organizer_details(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == organizer_id,
            User.role == UserRole.organizer
        )
    )

    organizer = result.scalar_one_or_none()

    if not organizer:
        raise HTTPException(
            status_code=404,
            detail="Organizer not found"
        )

    total_events = await db.scalar(
        select(func.count()).select_from(Event).where(
            Event.created_by == organizer.id
        )
    )

    total_uploaded_photos = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.uploaded_by == organizer.id
        )
    )

    return {
        "success": True,
        "data": {
            "id": str(organizer.id),
            "username": organizer.username,
            "email": organizer.email,
            "role": organizer.role.value,
            "profile_photo_url": organizer.profile_photo_url,
            "is_active": organizer.is_active,
            "created_at": organizer.created_at,
            "total_events": total_events or 0,
            "total_uploaded_photos": total_uploaded_photos or 0,
        }
    }


# ---------------------------------------------------
# GET ORGANIZER EVENTS
# ---------------------------------------------------

@router.get("/{organizer_id}/events")
async def get_organizer_events(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Event).where(
            Event.created_by == organizer_id
        )
    )

    events = result.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "id": str(event.id),
                "name": event.name,
                "description": event.description,
                "cover_image_url": event.cover_image_url,
                "created_at": event.created_at,
            }
            for event in events
        ]
    }


# ---------------------------------------------------
# DISABLE ORGANIZER
# ---------------------------------------------------

@router.patch("/{organizer_id}/disable")
async def disable_organizer(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == organizer_id,
            User.role == UserRole.organizer
        )
    )

    organizer = result.scalar_one_or_none()

    if not organizer:
        raise HTTPException(
            status_code=404,
            detail="Organizer not found"
        )

    organizer.is_active = False

    await db.commit()

    return {
        "success": True,
        "message": "Organizer disabled successfully"
    }


# ---------------------------------------------------
# ENABLE ORGANIZER
# ---------------------------------------------------

@router.patch("/{organizer_id}/enable")
async def enable_organizer(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == organizer_id,
            User.role == UserRole.organizer
        )
    )

    organizer = result.scalar_one_or_none()

    if not organizer:
        raise HTTPException(
            status_code=404,
            detail="Organizer not found"
        )

    organizer.is_active = True

    await db.commit()

    return {
        "success": True,
        "message": "Organizer enabled successfully"
    }


# ---------------------------------------------------
# PROMOTE ORGANIZER TO ADMIN
# ---------------------------------------------------

@router.patch("/{organizer_id}/promote-admin")
async def promote_organizer_to_admin(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == organizer_id,
            User.role == UserRole.organizer
        )
    )

    organizer = result.scalar_one_or_none()

    if not organizer:
        raise HTTPException(
            status_code=404,
            detail="Organizer not found"
        )

    organizer.role = UserRole.admin

    await db.commit()

    return {
        "success": True,
        "message": "Organizer promoted to admin successfully"
    }


# ---------------------------------------------------
# DEMOTE ORGANIZER TO USER
# ---------------------------------------------------

@router.patch("/{organizer_id}/demote")
async def demote_organizer_to_user(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == organizer_id,
            User.role == UserRole.organizer
        )
    )

    organizer = result.scalar_one_or_none()

    if not organizer:
        raise HTTPException(
            status_code=404,
            detail="Organizer not found"
        )

    organizer.role = UserRole.user

    await db.commit()

    return {
        "success": True,
        "message": "Organizer demoted to user successfully"
    }


# ---------------------------------------------------
# DELETE ORGANIZER
# ---------------------------------------------------

@router.delete("/{organizer_id}")
async def delete_organizer(
    organizer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == organizer_id,
            User.role == UserRole.organizer
        )
    )

    organizer = result.scalar_one_or_none()

    if not organizer:
        raise HTTPException(
            status_code=404,
            detail="Organizer not found"
        )

    await db.delete(organizer)
    await db.commit()

    return {
        "success": True,
        "message": "Organizer deleted successfully"
    }