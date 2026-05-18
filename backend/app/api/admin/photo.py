# app/api/admin_panel/photos.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID

from dependencies.db_dependency import get_db
from dependencies.get_admin_dependency import get_current_admin

from app.models.user import User
from app.models.photo import Photo, PhotoStatus

router = APIRouter(
    prefix="/admin/photos",
    tags=["Admin Photos"]
)


# ---------------------------------------------------
# GET ALL PHOTOS
# ---------------------------------------------------

@router.get("")
async def get_all_photos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[PhotoStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    query = select(Photo)

    count_query = select(func.count()).select_from(Photo)

    if status:
        query = query.where(Photo.status == status)
        count_query = count_query.where(Photo.status == status)

    query = (
        query
        .order_by(Photo.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    photos = result.scalars().all()

    total = await db.scalar(count_query)

    return {
        "success": True,
        "data": [
            {
                "id": str(photo.id),
                "event_id": str(photo.event_id),
                "uploaded_by": str(photo.uploaded_by) if photo.uploaded_by else None,
                "image_url": photo.image_url,
                "status": photo.status.value,
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
# GET FAILED PHOTOS
# ---------------------------------------------------

@router.get("/failed")
async def get_failed_photos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    result = await db.execute(
        select(Photo)
        .where(Photo.status == PhotoStatus.failed)
        .order_by(Photo.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )

    photos = result.scalars().all()

    total = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.status == PhotoStatus.failed
        )
    )

    return {
        "success": True,
        "data": [
            {
                "id": str(photo.id),
                "event_id": str(photo.event_id),
                "uploaded_by": str(photo.uploaded_by) if photo.uploaded_by else None,
                "image_url": photo.image_url,
                "status": photo.status.value,
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
# GET PENDING PHOTOS
# ---------------------------------------------------

@router.get("/pending")
async def get_pending_photos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    result = await db.execute(
        select(Photo)
        .where(Photo.status == PhotoStatus.pending)
        .order_by(Photo.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )

    photos = result.scalars().all()

    total = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.status == PhotoStatus.pending
        )
    )

    return {
        "success": True,
        "data": [
            {
                "id": str(photo.id),
                "event_id": str(photo.event_id),
                "uploaded_by": str(photo.uploaded_by) if photo.uploaded_by else None,
                "image_url": photo.image_url,
                "status": photo.status.value,
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
# GET COMPLETED PHOTOS
# ---------------------------------------------------

@router.get("/completed")
async def get_completed_photos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    offset = (page - 1) * limit

    result = await db.execute(
        select(Photo)
        .where(Photo.status == PhotoStatus.completed)
        .order_by(Photo.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )

    photos = result.scalars().all()

    total = await db.scalar(
        select(func.count()).select_from(Photo).where(
            Photo.status == PhotoStatus.completed
        )
    )

    return {
        "success": True,
        "data": [
            {
                "id": str(photo.id),
                "event_id": str(photo.event_id),
                "uploaded_by": str(photo.uploaded_by) if photo.uploaded_by else None,
                "image_url": photo.image_url,
                "status": photo.status.value,
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
# GET SINGLE PHOTO
# ---------------------------------------------------

@router.get("/{photo_id}")
async def get_photo_details(
    photo_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Photo).where(
            Photo.id == photo_id
        )
    )

    photo = result.scalar_one_or_none()

    if not photo:
        raise HTTPException(
            status_code=404,
            detail="Photo not found"
        )

    return {
        "success": True,
        "data": {
            "id": str(photo.id),
            "event_id": str(photo.event_id),
            "uploaded_by": str(photo.uploaded_by) if photo.uploaded_by else None,
            "image_url": photo.image_url,
            "status": photo.status.value,
            "uploaded_at": photo.uploaded_at,
        }
    }


# ---------------------------------------------------
# DELETE PHOTO
# ---------------------------------------------------

@router.delete("/{photo_id}")
async def delete_photo(
    photo_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    result = await db.execute(
        select(Photo).where(
            Photo.id == photo_id
        )
    )

    photo = result.scalar_one_or_none()

    if not photo:
        raise HTTPException(
            status_code=404,
            detail="Photo not found"
        )

    await db.delete(photo)
    await db.commit()

    return {
        "success": True,
        "message": "Photo deleted successfully"
    }