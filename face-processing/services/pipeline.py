import uuid
from services.embeddings import process_face
from services.face_detection import extract_faces
from services.vector_store import upsert_vector


def process_image(index, path, photo_id, event_id) -> bool:
    try:
        faces = extract_faces(path)
    except Exception:
        print(f"ERROR no face found in {path}")
        return False

    face_counter = 0

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
        face_counter += 1

    print(f"INFO: Indexed {face_counter} faces for photo id {photo_id}.")
    return True


def process_selfie(index, path, selfie_id):
    try:
        faces = extract_faces(path)
    except Exception:
        print(f"ERROR no face found in photo id: {selfie_id}")
        return

    if len(faces) == 0:
        print(f"ERROR no face found in photo id: {selfie_id}")
        return

    if len(faces) > 1:
        print(f"ERROR multiple faces found in selfie: {selfie_id}")
        return

    face_id = str(uuid.uuid4())
    vector = process_face(
        face=faces[0],
        face_id=face_id,
        photo_id=selfie_id,
        event_id="selfies",
    )

    upsert_vector(
        index=index,
        vector=vector,
        namespace="selfies",
    )
