# app/api/admin_panel/users.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from dependencies.db_dependency import get_db
from dependencies.get_admin_dependency import get_current_admin 

from app.models.user import User, UserRole
from app.models.event import Event
from app.models.photo import Photo
from app.models.user_selfie import UserSelfie

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin Users"]
)


# ---------------------------------------------------
# GET ALL USERS
# ---------------------------------------------------

@router.get("")
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    query = select(User).where(
        User.role == UserRole.user
    )

    count_query = select(func.count()).select_from(User).where(
        User.role == UserRole.user
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
    users = result.scalars().all()

    total = await db.scalar(count_query)

    return {
        "success": True,
        "data": [
            {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "profile_photo_url": user.profile_photo_url,
                "is_active": user.is_active,
                "created_at": user.created_at,
            }
            for user in users
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total or 0
        }
    }


# ---------------------------------------------------
# GET SINGLE USER
# ---------------------------------------------------

@router.get("/{user_id}")
async def get_user_details(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.user
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    selfies_count = await db.scalar(
        select(func.count()).select_from(UserSelfie).where(
            UserSelfie.user_id == user.id
        )
    )

    uploaded_photos_count = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.uploaded_by == user.id
        )
    )

    created_events_count = await db.scalar(
        select(func.count()).select_from(Event).where(
            Event.created_by == user.id
        )
    )

    return {
        "success": True,
        "data": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "profile_photo_url": user.profile_photo_url,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "selfies_count": selfies_count or 0,
            "uploaded_photos_count": uploaded_photos_count or 0,
            "created_events_count": created_events_count or 0,
        }
    }


# ---------------------------------------------------
# DISABLE USER
# ---------------------------------------------------

@router.patch("/{user_id}/disable")
async def disable_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.user
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = False

    await db.commit()

    return {
        "success": True,
        "message": "User disabled successfully"
    }


# ---------------------------------------------------
# ENABLE USER
# ---------------------------------------------------

@router.patch("/{user_id}/enable")
async def enable_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.user
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.is_active = True

    await db.commit()

    return {
        "success": True,
        "message": "User enabled successfully"
    }


# ---------------------------------------------------
# DELETE USER
# ---------------------------------------------------

@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(User).where(
            User.id == user_id,
            User.role == UserRole.user
        )
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    await db.delete(user)
    await db.commit()

    return {
        "success": True,
        "message": "User deleted successfully"
    }


# ---------------------------------------------------
# GET USER SELFIES
# ---------------------------------------------------

@router.get("/{user_id}/selfies")
async def get_user_selfies(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(UserSelfie).where(
            UserSelfie.user_id == user_id
        )
    )

    selfies = result.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "id": str(selfie.id),
                "image_url": selfie.image_url,
                "selfie_type": selfie.selfie_type.value,
                "created_at": selfie.created_at,
            }
            for selfie in selfies
        ]
    }


# ---------------------------------------------------
# GET USER PHOTOS
# ---------------------------------------------------

@router.get("/{user_id}/photos")
async def get_user_uploaded_photos(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Photo).where(
            Photo.uploaded_by == user_id
        )
    )

    photos = result.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "id": str(photo.id),
                "image_url": photo.image_url,
                "status": photo.status.value,
                "uploaded_at": photo.uploaded_at,
                "event_id": str(photo.event_id),
            }
            for photo in photos
        ]
    }