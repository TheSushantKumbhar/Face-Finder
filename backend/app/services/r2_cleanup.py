"""
Face Finder — R2 Cleanup Service
─────────────────────────────────
Centralized service for deleting files from Cloudflare R2 storage.
Used by event deletion, photo deletion, and selfie replacement.

All R2 cleanup operations MUST go through this module so that image
cleanup cannot be accidentally skipped in future delete operations.

Design:
  1. Extract R2 object keys from public URLs
  2. Batch-delete objects from R2 (up to 1000 per call via S3 DeleteObjects)
  3. Provide high-level helpers for events, photos, and selfies
  4. All operations are idempotent — deleting a non-existent key is not an error
"""

from __future__ import annotations

import traceback
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.concurrency import run_in_threadpool

from app.models.photo import Photo
from app.models.upload import Upload
from app.services.storage_service import r2, R2_BUCKET_NAME

# ── Constants ───────────────────────────────────────────────────

R2_PUBLIC_URL_PREFIX = "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev"


# ── Low-level R2 helpers ────────────────────────────────────────

def extract_r2_key(public_url: str) -> str | None:
    """Extract the R2 object key from a public CDN URL.

    Example:
        'https://pub-...r2.dev/uploads/user/abc.jpg' → 'uploads/user/abc.jpg'
    """
    if not public_url or R2_PUBLIC_URL_PREFIX not in public_url:
        return None
    return public_url.replace(f"{R2_PUBLIC_URL_PREFIX}/", "")


async def delete_r2_objects(keys: list[str]) -> int:
    """Batch-delete objects from R2.

    Uses S3's DeleteObjects API which supports up to 1000 keys per call.
    Returns the number of keys successfully submitted for deletion.
    Non-existent keys are silently ignored by R2 (idempotent).
    """
    if not keys:
        return 0

    # S3 DeleteObjects accepts up to 1000 keys per request
    deleted_count = 0
    for i in range(0, len(keys), 1000):
        batch = keys[i : i + 1000]
        objects = [{"Key": k} for k in batch]

        try:
            await run_in_threadpool(
                r2.delete_objects,
                Bucket=R2_BUCKET_NAME,
                Delete={"Objects": objects, "Quiet": True},
            )
            deleted_count += len(batch)
        except Exception:
            traceback.print_exc()
            raise

    return deleted_count


async def delete_single_r2_object(key: str) -> None:
    """Delete a single object from R2. Idempotent."""
    try:
        await run_in_threadpool(
            r2.delete_object,
            Bucket=R2_BUCKET_NAME,
            Key=key,
        )
    except Exception:
        traceback.print_exc()
        raise


# ── High-level: Event cleanup ──────────────────────────────────

async def collect_event_r2_keys(
    db: AsyncSession,
    event_id,
) -> list[str]:
    """Collect ALL R2 keys associated with an event.

    This gathers keys from:
      1. Photo records (image_url → R2 key)
      2. Upload records (file_key — the raw R2 key stored directly)
    """
    keys: list[str] = []

    # 1. Photo image URLs → R2 keys
    result = await db.execute(
        select(Photo.image_url).where(Photo.event_id == event_id)
    )
    photo_urls: Sequence[str] = result.scalars().all()
    for url in photo_urls:
        key = extract_r2_key(url)
        if key:
            keys.append(key)

    # 2. Upload file_key values (these are raw R2 keys)
    result = await db.execute(
        select(Upload.file_key).where(Upload.event_id == event_id)
    )
    upload_keys: Sequence[str] = result.scalars().all()
    for key in upload_keys:
        if key and key not in keys:
            keys.append(key)

    return keys


async def delete_event_with_r2_cleanup(
    db: AsyncSession,
    event,
) -> dict:
    """Delete an event and all its associated R2 files.

    Order of operations:
      1. Collect all R2 keys from photos and uploads
      2. Delete files from R2
      3. Only if R2 deletion succeeds, delete the event from DB
      4. If R2 fails, the DB transaction is NOT committed

    Returns a summary dict with counts.
    """
    from app.models.event import Event

    event_id = event.id

    # Step 1: Collect all R2 keys before any deletion
    r2_keys = await collect_event_r2_keys(db, event_id)

    # Step 2: Delete from R2 first (if this fails, DB stays intact)
    deleted_count = 0
    if r2_keys:
        deleted_count = await delete_r2_objects(r2_keys)

    # Step 3: Only now delete from DB
    # The cascade on Event will delete Photos, and the FK cascade
    # on Upload will clean up uploads + upload_parts
    await db.delete(event)
    await db.commit()

    return {
        "message": "Event deleted successfully",
        "r2_files_deleted": deleted_count,
        "r2_keys": r2_keys,
    }


# ── High-level: Single photo cleanup ───────────────────────────

async def delete_photo_with_r2_cleanup(
    db: AsyncSession,
    photo: Photo,
) -> None:
    """Delete a single photo record and its R2 file."""
    key = extract_r2_key(photo.image_url)
    if key:
        await delete_single_r2_object(key)

    await db.delete(photo)
    await db.commit()


# ── High-level: Batch photo cleanup (for replacing) ────────────

async def delete_photos_r2_only(
    image_urls: list[str],
) -> int:
    """Delete R2 files for a list of image URLs without touching the DB.
    Useful when replacing photos — the caller manages DB records.
    """
    keys = []
    for url in image_urls:
        key = extract_r2_key(url)
        if key:
            keys.append(key)
    if keys:
        return await delete_r2_objects(keys)
    return 0
