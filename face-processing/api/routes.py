from fastapi import APIRouter, status
from api.models import QueryMultipleRequest, QueryRequest, QueryResponse
from services.vector_store import query_faces


router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/query", response_model=QueryResponse)
async def query_photos(req: QueryRequest):
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

    seen_photo_ids = {}

    for vector_id in [front, left, right]:
        results = query_faces(
            input_face_id=vector_id,
            namespace=event_id,
            top_k=300,
            threshold=0.39,
        )
        for match in results:
            if (
                match.photo_id not in seen_photo_ids
                or match.score > seen_photo_ids[match.photo_id].score
            ):
                seen_photo_ids[match.photo_id] = match

    final_results = sorted(seen_photo_ids.values(), key=lambda x: x.score, reverse=True)

    print(f"INFO found {len(final_results)} faces for event: {event_id} from pinecone")
    print(final_results)

    return QueryResponse(
        status="done",
        matches=final_results,
    )
