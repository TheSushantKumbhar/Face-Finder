import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.callback_schemas import SelfieCallbackRequest, PhotoCallbackRequest
from app.models.photo import Photo, PhotoStatus
from app.models.user_selfie import UserSelfie
from dependencies.db_dependency import get_db

logger = logging.getLogger("callbacks")

router = APIRouter(prefix="/callback", tags=["Callbacks"])


@router.post("/selfie")
async def selfie_callback(
    request: SelfieCallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    selfie_id = request.selfie_id
    vector_id = request.vector_id
    success = request.success
    error_message = request.error_messsage

    if not success:
        logger.error(f"Selfie processing failed for {selfie_id}: {error_message}")
        # Mark selfie as failed if you add a status column later
        return {"message": "error recorded"}

    logger.info(f"Selfie callback received: selfie_id={selfie_id}, vector_id={vector_id}")

    # Store the vector_id on the selfie record
    try:
        result = await db.execute(
            select(UserSelfie).where(UserSelfie.id == selfie_id)
        )
        selfie = result.scalar_one_or_none()

        if not selfie:
            raise HTTPException(status_code=404, detail="Selfie not found")

        selfie.vector_id = vector_id
        await db.commit()

        logger.info(f"Selfie {selfie_id} updated with vector_id={vector_id}")
        return {"message": "selfie updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update selfie {selfie_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/photo")
async def photo_callback(
    request: PhotoCallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    photo_id = request.photo_id
    event_id = request.event_id
    success = request.success
    error_message = request.error_messsage

    try:
        result = await db.execute(
            select(Photo).where(Photo.id == photo_id)
        )
        photo = result.scalar_one_or_none()

        if not photo:
            logger.error(f"Photo callback: photo {photo_id} not found in DB")
            raise HTTPException(status_code=404, detail="Photo not found")

        if not success:
            photo.status = PhotoStatus.failed
            await db.commit()
            logger.error(f"Photo {photo_id} processing failed: {error_message}")
            return {"message": "photo marked as failed"}

        photo.status = PhotoStatus.processed
        await db.commit()
        logger.info(f"Photo {photo_id} in event {event_id} marked as processed")
        return {"message": "photo marked as processed"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to update photo {photo_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
