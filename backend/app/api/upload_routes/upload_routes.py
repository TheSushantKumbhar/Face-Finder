from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.concurrency import run_in_threadpool
import uuid
import os
from datetime import datetime

from dependencies.db_dependency import get_db
from app.models.upload import Upload
from app.models.upload_part import UploadPart
from app.services.storage_service import r2

from app.models.photo import Photo, PhotoStatus
from uuid import UUID


router = APIRouter(prefix="/upload", tags=["Upload"])


# INIT UPLOAD
@router.post("/init")
async def init_upload(
    file_name: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        upload_id = str(uuid.uuid4())
        file_key = f"uploads/{user_id}/{upload_id}_{file_name}"

        response = r2.create_multipart_upload(
            Bucket=os.getenv("R2_BUCKET_NAME"),
            Key=file_key,
            ContentType="image/jpeg"
        )

        upload = Upload(
            upload_id=upload_id,
            user_id=user_id,
            file_key=file_key,
            r2_upload_id=response["UploadId"],
            status="in_progress",
            created_at=datetime.utcnow()
        )

        db.add(upload)
        await db.commit()

        return {
            "upload_id": upload_id,
            "file_key": file_key,
            "r2_upload_id": response["UploadId"],
            "chunk_size": 5 * 1024 * 1024
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# PRESIGNED URL
@router.post("/presigned-url")
async def get_presigned_url(
    upload_id: str,
    part_number: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Upload).where(Upload.upload_id == upload_id)
    )
    upload = result.scalar_one_or_none()

    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    try:
        url = await run_in_threadpool(
            r2.generate_presigned_url,
            "upload_part",
            {
                "Bucket": os.getenv("R2_BUCKET_NAME"),
                "Key": upload.file_key,
                "UploadId": upload.r2_upload_id,
                "PartNumber": part_number,
            },
            3600
        )

        return {"url": url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#  PART COMPLETE (ETag STORAGE)
@router.post("/part-complete")
async def part_complete(
    upload_id: str,
    part_number: int,
    etag: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Clean ETag
        etag = etag.replace('"', '')

        # Check upload exists
        result = await db.execute(
            select(Upload).where(Upload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()

        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")

        # Prevent duplicate parts
        result = await db.execute(
            select(UploadPart).where(
                UploadPart.upload_id == upload_id,
                UploadPart.part_number == part_number
            )
        )
        existing_part = result.scalar_one_or_none()

        if existing_part:
            existing_part.etag = etag
        else:
            part = UploadPart(
                upload_id=upload_id,
                part_number=part_number,
                etag=etag
            )
            db.add(part)

        await db.commit()

        return {"message": "Part stored successfully"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


from app.models.photo import Photo, PhotoStatus
from uuid import UUID

@router.post("/complete")
async def complete_upload(
    upload_id: str,
    event_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Get upload
        result = await db.execute(
            select(Upload).where(Upload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()

        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")

        # 2. Get parts
        result = await db.execute(
            select(UploadPart).where(UploadPart.upload_id == upload_id)
        )
        parts = result.scalars().all()

        if not parts:
            raise HTTPException(status_code=400, detail="No parts uploaded")

        # 3. Sort parts
        sorted_parts = sorted(parts, key=lambda x: x.part_number)

        # 4. Format for R2
        r2_parts = [
            {
                "PartNumber": part.part_number,
                "ETag": part.etag
            }
            for part in sorted_parts
        ]

        # 5. Complete upload in R2
        await run_in_threadpool(
            r2.complete_multipart_upload,
            Bucket=os.getenv("R2_BUCKET_NAME"),
            Key=upload.file_key,
            UploadId=upload.r2_upload_id,
            MultipartUpload={"Parts": r2_parts}
        )

        #  6. Create Photo entry
        image_url = f"https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev/{upload.file_key}"

        photo = Photo(
            event_id=UUID(event_id),
            uploaded_by=UUID(user_id),
            image_url=image_url,
            status=PhotoStatus.pending
        )

        db.add(photo)

        # 7. Update upload status
        upload.status = "completed"

        await db.commit()

        return {
            "message": "Upload completed successfully",
            "image_url": image_url
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    


@router.get("/status")
async def upload_status(
    upload_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Check upload exists
        result = await db.execute(
            select(Upload).where(Upload.upload_id == upload_id)
        )
        upload = result.scalar_one_or_none()

        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")

        # 2. Get uploaded parts
        result = await db.execute(
            select(UploadPart.part_number).where(
                UploadPart.upload_id == upload_id
            )
        )

        parts = result.scalars().all()

        return {
            "upload_id": upload_id,
            "uploaded_parts": parts,
            "status": upload.status
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))