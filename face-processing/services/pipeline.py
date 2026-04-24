from services.embeddings import process_face
from services.face_detection import extract_faces
from services.vector_store import upsert_vector


def process_image(index, path, filename, face_counter, namespace):
    try:
        faces = extract_faces(path)
    except Exception:
        print(f"ERROR no face found in {path}")
        return face_counter

    for face in faces:
        vector = process_face(face, face_counter, filename)
        upsert_vector(index, vector, namespace)

        face_counter += 1

    return face_counter
