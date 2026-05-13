import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import event, select
from pydantic import BaseModel
from uuid import UUID

from dependencies.db_dependency import get_db
from dependencies.get_user_dependency import get_current_user
from app.models.user import User
from app.models.user_selfie import UserSelfie, SelfieType

logger = logging.getLogger("photo_retrieval")

router = APIRouter(prefix="/photo-retrieval", tags=["Photo Retrieval"])

# Face-processing service (runs on port 6969 locally)
FACE_PROCESSING_BASE_URL = "http://localhost:6969"


class RetrieveRequest(BaseModel):
    event_id: str


# @router.post("/retrieve")
# async def retrieve_photos(
# req: RetrieveRequest,
# db: AsyncSession = Depends(get_db),
# current_user: User = Depends(get_current_user),
# ):
# """
# Retrieve matching photos for the authenticated user in a given event.

# 1. Fetches the user's front selfie vector_id from the user_selfies table.
# 2. Calls the face-processing /query endpoint with that vector_id and the event_id.
# 3. Returns the matched results from Pinecone.
# """
# Step 1: Get the front selfie vector_id for the current user
# result = await db.execute(
# select(UserSelfie).where(
# UserSelfie.user_id == current_user.id,
# UserSelfie.selfie_type == SelfieType.front,
# )
# )
# front_selfie = result.scalar_one_or_none()

# if not front_selfie:
# raise HTTPException(
# status_code=404,
# detail="Front selfie not found. Please upload your selfies first.",
# )

# if not front_selfie.vector_id:
# raise HTTPException(
# status_code=400,
# detail="Front selfie has not been processed yet. Please wait and try again.",
# )

# vector_id = front_selfie.vector_id
# event_id = req.event_id

# logger.info(
# f"Retrieving photos for user={current_user.id}, event={event_id}, vector_id={vector_id}"
# )

# Step 2: Call the face-processing /query endpoint
# try:
# async with httpx.AsyncClient(timeout=30.0) as client:
# response = await client.post(
# f"{FACE_PROCESSING_BASE_URL}/query",
# json={
# "vector_id": vector_id,
# "event_id": event_id,
# },
# )
# response.raise_for_status()
# query_result = response.json()
# except httpx.ConnectError:
# logger.error("Face-processing service is unreachable")
# raise HTTPException(
# status_code=503,
# detail="Face processing service is currently unavailable.",
# )
# except httpx.HTTPStatusError as e:
# logger.error(
# f"Face-processing query failed: {e.response.status_code} - {e.response.text}"
# )
# raise HTTPException(
# status_code=502,
# detail=f"Face processing query failed: {e.response.text}",
# )
# except Exception as e:
# logger.error(f"Unexpected error calling face-processing service: {e}")
# raise HTTPException(
# status_code=500,
# detail="An unexpected error occurred during photo retrieval.",
# )

# logger.info(
# f"Query returned {len(query_result.get('matches', []))} matches for event={event_id}"
# )

# return {
# "status": "success",
# "event_id": event_id,
# "vector_id": vector_id,
# "matches": query_result.get("matches", []),
# }


@router.post("/retrieve")
async def retrieve_photos(
    req: RetrieveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve matching photos for the authenticated user in a given event.

    1. Fetches the user's front selfie vector_id from the user_selfies table.
    2. Calls the face-processing /query endpoint with that vector_id and the event_id.
    3. Returns the matched results from Pinecone.
    """
    # Step 1: Get the front selfie vector_id for the current user
    result = await db.execute(
        select(UserSelfie).where(
            UserSelfie.user_id == current_user.id,
            UserSelfie.selfie_type.in_(
                [
                    SelfieType.front,
                    SelfieType.left,
                    SelfieType.right,
                ]
            ),
        )
    )

    selfies = result.scalars().all()

    # Convert into a dictionary for easy access
    selfie_map = {selfie.selfie_type: selfie for selfie in selfies}

    front_selfie = selfie_map.get(SelfieType.front)
    left_selfie = selfie_map.get(SelfieType.left)
    right_selfie = selfie_map.get(SelfieType.right)

    if not front_selfie:
        raise HTTPException(
            status_code=404,
            detail="Front selfie not found. Please upload your selfies first.",
        )

    if not left_selfie:
        raise HTTPException(
            status_code=404,
            detail="Left selfie not found. Please upload your selfies first.",
        )

    if not right_selfie:
        raise HTTPException(
            status_code=404,
            detail="Right selfie not found. Please upload your selfies first.",
        )

    if not front_selfie.vector_id:
        raise HTTPException(
            status_code=400,
            detail="Front selfie has not been processed yet. Please wait and try again.",
        )

    if not left_selfie.vector_id:
        raise HTTPException(
            status_code=400,
            detail="Left selfie has not been processed yet. Please wait and try again.",
        )

    if not right_selfie.vector_id:
        raise HTTPException(
            status_code=400,
            detail="Right selfie has not been processed yet. Please wait and try again.",
        )

    front_vector_id = front_selfie.vector_id
    left_vector_id = left_selfie.vector_id
    right_vector_id = right_selfie.vector_id
    event_id = req.event_id

    logger.info(
        f"Retrieving photos for user={current_user.id}, event={event_id}, vector_id={front_vector_id}"
    )

    # Step 2: Call the face-processing /query endpoint
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # response = await client.post(
            # f"{FACE_PROCESSING_BASE_URL}/query",
            # json={
            #    "vector_id": vector_id,
            #    "event_id": event_id,
            # },
            # )
            response = await client.post(
                f"{FACE_PROCESSING_BASE_URL}/query_multiple",
                json={
                    "front_vector_id": front_vector_id,
                    "left_vector_id": left_vector_id,
                    "right_vector_id": right_vector_id,
                    "event_id": event_id,
                },
            )
            response.raise_for_status()
            query_result = response.json()
    except httpx.ConnectError:
        logger.error("Face-processing service is unreachable")
        raise HTTPException(
            status_code=503,
            detail="Face processing service is currently unavailable.",
        )
    except httpx.HTTPStatusError as e:
        logger.error(
            f"Face-processing query failed: {e.response.status_code} - {e.response.text}"
        )
        raise HTTPException(
            status_code=502,
            detail=f"Face processing query failed: {e.response.text}",
        )
    except Exception as e:
        logger.error(f"Unexpected error calling face-processing service: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during photo retrieval.",
        )

    logger.info(
        f"Query returned {len(query_result.get('matches', []))} matches for event={event_id}"
    )

    return {
        "status": "success",
        "event_id": event_id,
        # "vector_id": vector_id,
        "vector_id": front_vector_id,
        "matches": query_result.get("matches", []),
    }
