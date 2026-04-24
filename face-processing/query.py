from services.face_detection import extract_faces
from services.embeddings import normalize_embedding
from services.vector_store import init_index
from config import TOP_K, THRESHOLD

NAMESPACE = "test_3"


def filter_matches(matches, threshold):
    """Filter by score and deduplicate image paths."""
    seen = set()
    results = []

    for match in matches:
        score = match["score"]
        path = match["metadata"]["filename"]

        if score >= threshold and path not in seen:
            results.append({"path": path, "score": round(score, 4)})
            seen.add(path)

    return results


def query_photos(input_photo: str) -> list[dict]:
    """
    Given a selfie, returns event photos where the person appears.
    """
    print(f"INFO Extracting embedding from: {input_photo}")

    try:
        faces = extract_faces(input_photo)
    except ValueError:
        print("INFO No face detected in input photo. Use a clear front-facing photo.")
        return []

    if not faces:
        print("INFO No faces found.")
        return []

    # Use first detected face (can improve later)
    raw_embedding = faces[0]["embedding"]
    query_vector = normalize_embedding(raw_embedding)

    # Init index
    index = init_index()

    # Query Pinecone
    response = index.query(
        vector=query_vector,
        top_k=TOP_K,
        include_metadata=True,
        namespace=NAMESPACE,
    )

    matches = response["matches"]

    return filter_matches(matches, THRESHOLD)


if __name__ == "__main__":
    selfie = "./query_images/avani.png"

    results = query_photos(selfie)

    if results:
        print(f"\nINFO Found {len(results)} results:\n")
        for r in results:
            print(f"[{r['score']}] {r['path']}")
    else:
        print("\nERROR No matches found. Try lowering threshold.")
