import uuid
from services.embeddings import process_face
from services.face_detection import extract_faces
from services.vector_store import upsert_vector


def process_image(index, path, photo_id, event_id):
    try:
        faces = extract_faces(path)
    except Exception:
        print(f"ERROR no face found in {path}")
        return

    for face in faces:
        face_id = str(uuid.uuid4())
        vector = process_face(
            face=face,
            face_id=face_id,
            photo_id=photo_id,
            event_id=event_id,
        )

        upsert_vector(
            index=index,
            vector=vector,
            namespace=event_id,
        )
