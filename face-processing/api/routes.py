from typing import List
from fastapi import APIRouter
from api.models import (
    QueryMatchResponse,
    QueryMultipleRequest,
    QueryRequest,
    QueryResponse,
)
from services.pipeline import query_photos
from services.vector_store import query_faces


router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/query", response_model=QueryResponse)
async def query_single(req: QueryRequest):
    vector_id = req.vector_id
    event_id = req.event_id

    results = query_faces(
        input_face_id=vector_id,
        namespace=event_id,
        top_k=100,
        threshold=0.51,
    )

    print(f"INFO found {len(results)} faces for event: {event_id} from pinecone")
    print(results)

    return QueryResponse(
        status="done",
        matches=results,
    )


@router.post("/query_multiple", response_model=QueryResponse)
async def query_multiple(req: QueryMultipleRequest):
    front = req.front_vector_id
    left = req.left_vector_id
    right = req.right_vector_id
    event_id = req.event_id

    final_results: List[QueryMatchResponse] = query_photos(
        front=front,
        left=left,
        right=right,
        event_id=event_id,
    )

    return QueryResponse(
        status="done",
        matches=final_results,
    )
