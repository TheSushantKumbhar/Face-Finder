from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from dependencies.db_dependency import get_db
from dependencies.get_user_dependency import get_current_user
from app.models.user import User
from app.models.user_selfie import UserSelfie, SelfieType
from app.services.selfie_service import SelfieService

router = APIRouter(prefix="/selfies", tags=["Selfies"])


@router.get("/status")
async def selfie_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check whether the authenticated user has uploaded all 3 selfies.
    """
    result = await db.execute(
        select(UserSelfie).where(UserSelfie.user_id == current_user.id)
    )
    selfies = result.scalars().all()

    selfie_map = {s.selfie_type: s.image_url for s in selfies}

    has_all = all(
        t.value in [s.selfie_type if isinstance(s.selfie_type, str) else s.selfie_type.value for s in selfies]
        for t in SelfieType
    )

    return {
        "has_selfies": has_all,
        "selfies": {
            "front_url": selfie_map.get(SelfieType.front) or selfie_map.get("front"),
            "left_url": selfie_map.get(SelfieType.left) or selfie_map.get("left"),
            "right_url": selfie_map.get(SelfieType.right) or selfie_map.get("right"),
        }
    }


@router.post("/upload-selfie")
async def upload_selfie(
    front_image: UploadFile = File(...),
    left_image: UploadFile = File(...),
    right_image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads three multi-angle selfies for the user and stores them in R2.
    Overwrites if they already exist.
    """
    urls = await SelfieService.process_and_upload_selfies(
        db=db,
        user=current_user,
        front_image=front_image,
        left_image=left_image,
        right_image=right_image
    )
    
    return {
        "message": "Selfies uploaded successfully",
        "data": {
            "front_url": urls.get("front_url"),
            "left_url": urls.get("left_url"),
            "right_url": urls.get("right_url")
        }
    }
