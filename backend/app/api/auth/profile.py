from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.concurrency import run_in_threadpool
from typing import Optional
import io

from dependencies.db_dependency import get_db
from dependencies.get_user_dependency import get_current_user
from app.models.user import User
from app.services.storage_service import r2, R2_BUCKET_NAME

R2_PUBLIC_URL_PREFIX = "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev"

router = APIRouter(prefix="/auth", tags=["Profile"])


@router.patch("/profile")
async def update_profile(
    username: Optional[str] = Form(None),
    profile_photo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if username is not None:
        username = username.strip()
        if len(username) < 2:
            raise HTTPException(status_code=400, detail="Username must be at least 2 characters")
        if len(username) > 30:
            raise HTTPException(status_code=400, detail="Username must be at most 30 characters")
        current_user.username = username

    if profile_photo is not None:
        content_type = profile_photo.content_type or ""
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        file_bytes = await profile_photo.read()
        ext = profile_photo.filename.rsplit(".", 1)[-1].lower() if profile_photo.filename else "jpg"
        key = f"profile-photos/{current_user.id}/avatar.{ext}"

        try:
            await run_in_threadpool(
                r2.upload_fileobj,
                io.BytesIO(file_bytes),
                R2_BUCKET_NAME,
                key,
                ExtraArgs={"ContentType": content_type},
            )
            current_user.profile_photo_url = f"{R2_PUBLIC_URL_PREFIX}/{key}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

    await db.commit()
    await db.refresh(current_user)

    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role.value if current_user.role else "user",
        "profile_photo_url": current_user.profile_photo_url,
    }
