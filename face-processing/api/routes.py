from fastapi import APIRouter, status
from api.models import QueryRequest, QueryResponse
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
