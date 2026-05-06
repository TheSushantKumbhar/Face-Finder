from pinecone import Pinecone, ServerlessSpec
from config import DIMENSION, INDEX_NAME, PINECONE_API_KEY

pc = Pinecone(api_key=PINECONE_API_KEY)


def init_index():
    if INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=INDEX_NAME,
            dimension=DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    return pc.Index(INDEX_NAME)


index = init_index()


def upsert_batch_vectors(index, vectors, namespace="default", batch_size=50):
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)


def upsert_vector(index, vector, namespace):
    upsert_batch_vectors(
        index=index,
        vectors=[vector],
        namespace=namespace,
    )


def query_faces(input_face_id: str, namespace: str, top_k: int = 10):
    fetch_response = index.fetch(ids=[input_face_id], namespace="selfies")

    if input_face_id not in fetch_response["vectors"]:
        raise ValueError(f"Face ID {input_face_id} not in index")

    face_vector = fetch_response["vectors"][input_face_id]["values"]

    results = index.query(
        vector=face_vector,
        top_k=top_k + 1,
        namespace=namespace,
        include_metadata=True,
    )

    return [m for m in results["matches"] if m["id"] != input_face_id]
