import os
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from fastapi.concurrency import run_in_threadpool

from app.models.user import User
from app.models.user_selfie import UserSelfie, SelfieType
from app.services.storage_service import r2, R2_BUCKET_NAME

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
R2_PUBLIC_URL_PREFIX = "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev"

def is_allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS

class SelfieService:
    @staticmethod
    async def process_and_upload_selfies(
        db: AsyncSession,
        user: User,
        front_image: UploadFile,
        left_image: UploadFile,
        right_image: UploadFile
    ) -> dict:
        
        images = {
            SelfieType.front: front_image,
            SelfieType.left: left_image,
            SelfieType.right: right_image
        }

        # 1. Validate files
        for selfie_type, file in images.items():
            if not is_allowed_file(file.filename):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid file type for {selfie_type.value}. Only jpg, jpeg, png allowed."
                )

        urls = {}
        
        # 2. Upload to R2 and update DB
        for selfie_type, file in images.items():
            ext = file.filename.rsplit(".", 1)[1].lower()
            key = f"selfies/{user.id}/{selfie_type.value}.{ext}"

            try:
                # Upload using threadpool since boto3 is sync
                await run_in_threadpool(
                    r2.upload_fileobj,
                    file.file,
                    R2_BUCKET_NAME,
                    key,
                    ExtraArgs={"ContentType": file.content_type}
                )
                
                image_url = f"{R2_PUBLIC_URL_PREFIX}/{key}"
                urls[f"{selfie_type.value}_url"] = image_url

                # Upsert into DB
                stmt = insert(UserSelfie).values(
                    user_id=user.id,
                    selfie_type=selfie_type,
                    image_url=image_url
                )
                
                stmt = stmt.on_conflict_do_update(
                    constraint="unique_user_selfie_type",
                    set_={"image_url": stmt.excluded.image_url}
                )

                await db.execute(stmt)

            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload {selfie_type.value}: {str(e)}"
                )

        await db.commit()
        return urls
