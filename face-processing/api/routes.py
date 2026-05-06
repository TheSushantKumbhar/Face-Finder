from fastapi import APIRouter
from api.models import QueryRequest
from services.vector_store import query_faces


router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/query")
async def query_photos(req: QueryRequest):
    vector_id = req.vector_id
    event_id = req.event_id

    results = query_faces(
        input_face_id=vector_id,
        namespace=event_id,
        top_k=100,
    )

    print(f"INFO found {len(results)} faces for event: {event_id} from pinecone")
    print("-------------------------------------------------------------------")
    print(results)

    return {"status": "done querying"}
