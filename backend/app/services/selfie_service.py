import os
import time
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from fastapi.concurrency import run_in_threadpool

from app.config import ROUTING_KEY_SELFIE
from app.models.user import User
from app.models.user_selfie import UserSelfie, SelfieType
from app.services.producer import Producer
from app.services.storage_service import r2, R2_BUCKET_NAME
from app.services.r2_cleanup import extract_r2_key, delete_single_r2_object

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
R2_PUBLIC_URL_PREFIX = "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev"


def is_allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


async def _delete_old_selfie_from_r2(
    db: AsyncSession, user_id, selfie_type: SelfieType
) -> None:
    """Look up the existing selfie record and delete the old file from R2."""
    result = await db.execute(
        select(UserSelfie).where(
            UserSelfie.user_id == user_id, UserSelfie.selfie_type == selfie_type
        )
    )
    existing = result.scalar_one_or_none()
    if existing and existing.image_url:
        old_key = extract_r2_key(existing.image_url)
        if old_key:
            try:
                await delete_single_r2_object(old_key)
            except Exception:
                # Don't fail the upload if old file deletion fails
                import traceback

                traceback.print_exc()


class SelfieService:
    @staticmethod
    async def process_and_upload_selfies(
        db: AsyncSession,
        user: User,
        front_image: UploadFile,
        left_image: UploadFile,
        right_image: UploadFile,
    ) -> dict:

        images = {
            SelfieType.front: front_image,
            SelfieType.left: left_image,
            SelfieType.right: right_image,
        }

        # 1. Validate files
        for selfie_type, file in images.items():
            if not is_allowed_file(file.filename):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid file type for {selfie_type.value}. Only jpg, jpeg, png allowed.",
                )

        urls = {}

        # 2. Upload to R2 and update DB
        for selfie_type, file in images.items():
            ext = file.filename.rsplit(".", 1)[1].lower()
            ts = int(time.time() * 1000)
            key = f"selfies/{user.id}/{selfie_type.value}_{ts}.{ext}"

            try:
                # Delete old file from R2 if it exists
                await _delete_old_selfie_from_r2(db, user.id, selfie_type)

                # Upload using threadpool since boto3 is sync
                await run_in_threadpool(
                    r2.upload_fileobj,
                    file.file,
                    R2_BUCKET_NAME,
                    key,
                    ExtraArgs={"ContentType": file.content_type},
                )

                image_url = f"{R2_PUBLIC_URL_PREFIX}/{key}"
                urls[f"{selfie_type.value}_url"] = image_url

                # Upsert into DB
                stmt = insert(UserSelfie).values(
                    user_id=user.id, selfie_type=selfie_type, image_url=image_url
                )

                stmt = stmt.on_conflict_do_update(
                    constraint="unique_user_selfie_type",
                    set_={"image_url": stmt.excluded.image_url},
                )

                await db.execute(stmt)

            except Exception as e:
                import traceback

                traceback.print_exc()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload {selfie_type.value}: {str(e)}",
                )

        await db.commit()
        return urls

    @staticmethod
    async def upload_single_selfie(
        db: AsyncSession, user: User, selfie_type_str: str, image: UploadFile
    ) -> str:
        """Upload a single selfie image by type (front/left/right)."""

        # Validate selfie type
        try:
            selfie_type = SelfieType(selfie_type_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid selfie type '{selfie_type_str}'. Must be one of: front, left, right.",
            )

        # Validate file
        if not is_allowed_file(image.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for {selfie_type.value}. Only jpg, jpeg, png allowed.",
            )

        ext = image.filename.rsplit(".", 1)[1].lower()
        ts = int(time.time() * 1000)
        key = f"selfies/{user.id}/{selfie_type.value}_{ts}.{ext}"

        try:
            # Delete old file from R2 if it exists
            await _delete_old_selfie_from_r2(db, user.id, selfie_type)

            await run_in_threadpool(
                r2.upload_fileobj,
                image.file,
                R2_BUCKET_NAME,
                key,
                ExtraArgs={"ContentType": image.content_type},
            )

            image_url = f"{R2_PUBLIC_URL_PREFIX}/{key}"

            # Upsert into DB
            stmt = insert(UserSelfie).values(
                user_id=user.id, selfie_type=selfie_type, image_url=image_url
            )
            stmt = stmt.on_conflict_do_update(
                constraint="unique_user_selfie_type",
                set_={"image_url": stmt.excluded.image_url},
            ).returning(UserSelfie.id)

            result = await db.execute(stmt)
            selfie_id = result.scalar_one()
            await db.commit()

            payload = {
                "selfieID": str(selfie_id),
                "r2URL": image_url,
            }

            producer = Producer()
            producer.publish(routing_key=ROUTING_KEY_SELFIE, msg=payload)
            print("INFO sent message to exchange")
            producer.close()

            return image_url

        except Exception as e:
            import traceback

            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload {selfie_type.value}: {str(e)}",
            )