import numpy as np


def normalize_embedding(embedding):
    vec = np.array(embedding)
    return (vec / np.linalg.norm(vec)).tolist()


def process_face(face, face_id, filename):
    embedding = normalize_embedding(face["embedding"])
    return {
        "id": f"face-{face_id}",
        "values": embedding,
        "metadata": {
            "photo_id": filename,
        },
    }
