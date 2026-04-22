from services import face_detection
from services.embeddings import normalize_embedding
from services.vector_store import init_index, upsert_vectors
from services.face_detection import extract_faces
from utils.image_loader import load_images


def main():
    index = init_index()
    vectors = []
    face_counter = 0

    for filename, path in load_images():
        print(f"INFO processing {filename}")

        try:
            results = extract_faces(path)
        except Exception:
            print(f"ERROR no face found in {path}")
            continue

        for face in results:
            embedding = normalize_embedding(face["embedding"])
            vectors.append(
                {
                    "id": f"face-{face_counter}",
                    "values": embedding,
                    "metadata": {
                        "filename": filename,
                    },
                }
            )

            face_counter += 1

        namespace = "test2"
        upsert_vectors(
            index=index,
            vectors=vectors,
            namespace=namespace,
        )

        print(f"INFO Indexed {face_counter} faces")


if __name__ == "__main__":
    main()
