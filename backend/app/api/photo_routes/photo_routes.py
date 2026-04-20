from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from dependencies.db_dependency import get_db
from app.models.event import Event
from app.models.photo import Photo
from app.models.user import User

from app.services.storage_service import upload_file
from dependencies.get_user_dependency import get_current_user
from dependencies.role_dependency import require_organizer

router = APIRouter(prefix="/photos",tags=["Photos"])

@router.post("/upload/{event_id}")
async def upload_photo(
    event_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_organizer)
):
    # check event exists
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # generate unique filename
    filename = f"{event_id}/{uuid.uuid4()}_{file.filename}"

    # upload to R2
    file_content = await file.read()
    image_url = upload_file(file_content, filename, file.content_type)

    # save to DB
    new_photo = Photo(
        event_id=event_id,
        uploaded_by=current_user.id,
        image_url=image_url,
        status="pending"
    )

    db.add(new_photo)
    await db.commit()
    await db.refresh(new_photo)

    return {
        "message": "Photo uploaded",
        "photo_id": new_photo.id,
        "image_url": image_url
    }