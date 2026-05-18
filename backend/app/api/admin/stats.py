# app/api/admin_panel/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from dependencies.db_dependency import get_db
from dependencies.get_admin_dependency import get_current_admin 

from app.models.user import User, UserRole
from app.models.event import Event
from app.models.photo import Photo, PhotoStatus
from app.models.user_selfie import UserSelfie
from app.models.upload import Upload

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"]
)


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):

    try:

        total_users = await db.scalar(
            select(func.count()).select_from(User).where(
                User.role == UserRole.user
            )
        )

        total_organizers = await db.scalar(
            select(func.count()).select_from(User).where(
                User.role == UserRole.organizer
            )
        )

        total_admins = await db.scalar(
            select(func.count()).select_from(User).where(
                User.role == UserRole.admin
            )
        )

        total_events = await db.scalar(
            select(func.count()).select_from(Event)
        )

        total_photos = await db.scalar(
            select(func.count()).select_from(Photo)
        )

        total_selfies = await db.scalar(
            select(func.count()).select_from(UserSelfie)
        )

        total_uploads = await db.scalar(
            select(func.count()).select_from(Upload)
        )

        active_uploads = await db.scalar(
            select(func.count()).select_from(Upload).where(
                Upload.status == "in_progress"
            )
        )

        completed_photos = await db.scalar(
            select(func.count()).select_from(Photo).where(
                Photo.status == PhotoStatus.completed
            )
        )

        failed_photos = await db.scalar(
            select(func.count()).select_from(Photo).where(
                Photo.status == PhotoStatus.failed
            )
        )

        pending_photos = await db.scalar(
            select(func.count()).select_from(Photo).where(
                Photo.status == PhotoStatus.pending
            )
        )

        return {
            "success": True,
            "data": {
                "total_users": total_users or 0,
                "total_organizers": total_organizers or 0,
                "total_admins": total_admins or 0,
                "total_events": total_events or 0,
                "total_photos": total_photos or 0,
                "total_selfies": total_selfies or 0,
                "total_uploads": total_uploads or 0,
                "active_uploads": active_uploads or 0,
                "completed_photos": completed_photos or 0,
                "failed_photos": failed_photos or 0,
                "pending_photos": pending_photos or 0,
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard stats: {str(e)}"
        )




