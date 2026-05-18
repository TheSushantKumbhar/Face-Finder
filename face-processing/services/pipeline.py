from typing import List, Optional, Tuple, TypedDict
import uuid
from api.models import QueryMatchResponse
from collections import defaultdict
from config import ANGLE_CONFIG, ANGLE_THRESHOLDS
from services.embeddings import process_face
from services.face_detection import extract_faces
from services.vector_store import query_faces, upsert_vector


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


def process_selfie(index, path, selfie_id) -> Tuple[Optional[str], bool]:
    try:
        faces = extract_faces(path)
    except Exception:
        print(f"ERROR no face found in photo id: {selfie_id}")
        return None, False

    if len(faces) == 0:
        print(f"ERROR no face found in photo id: {selfie_id}")
        return None, False

    if len(faces) > 1:
        print(f"ERROR multiple faces found in selfie: {selfie_id}")
        return None, False

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

    return f"face-{face_id}", True


class PhotoEntry(TypedDict):
    weighted_score: float
    angles: List[str]
    best_match: Optional[QueryMatchResponse]
    angle_scores: dict[str, float]  # add this


def make_entry() -> PhotoEntry:
    return {
        "weighted_score": 0.0,
        "angles": [],
        "best_match": None,
        "angle_scores": {},
    }  # add this


def query_photos(
    front: str,
    left: str,
    right: str,
    event_id: str,
) -> List[QueryMatchResponse]:
    angle_inputs = [
        (name, vector_id, weight)
        for (name, weight), vector_id in zip(ANGLE_CONFIG, [front, left, right])
    ]

    photo_scores: defaultdict[str, PhotoEntry] = defaultdict(make_entry)

    # track front scores separately for the gate
    front_matched_ids: set[str] = set()

    for angle_name, vector_id, weight in angle_inputs:
        if not vector_id:
            continue
        results = query_faces(
            input_face_id=vector_id,
            namespace=event_id,
            top_k=300,
            threshold=ANGLE_THRESHOLDS[angle_name],
        )
        for match in results:
            entry = photo_scores[match.photo_id]
            entry["weighted_score"] += match.score * weight
            entry["angles"].append(angle_name)
            entry["angle_scores"][angle_name] = match.score  # add this
            if entry["best_match"] is None or match.score > entry["best_match"].score:
                entry["best_match"] = match
            if angle_name == "front":
                front_matched_ids.add(match.photo_id)

    final_results = sorted(
        photo_scores.values(), key=lambda x: x["weighted_score"], reverse=True
    )

    print(f"INFO found {len(final_results)} faces for event: {event_id} from pinecone")

    # DEBUG
    for entry in final_results:
        if entry["best_match"] is not None:
            unique_angles = set(entry["angles"])
            in_front = entry["best_match"].photo_id in front_matched_ids
            angle_scores_str = " | ".join(
                f"{a}={entry['angle_scores'][a]:.4f}"
                if a in entry["angle_scores"]
                else f"{a}=N/A"
                for a in ["front", "left", "right"]
            )
            print(
                f"photo_id={entry['best_match'].photo_id} | "
                f"weighted_score={entry['weighted_score']:.4f} | "
                f"angles={unique_angles} | "
                f"front_matched={in_front} | "
                f"angle_count={len(entry['angles'])} | "
                f"{angle_scores_str}"
            )

    return [
        QueryMatchResponse(
            photo_id=entry["best_match"].photo_id,
            score=entry["weighted_score"],
        )
        for entry in final_results
        if entry["best_match"] is not None
        and entry["best_match"].photo_id
        in front_matched_ids  # front must agree, no escape hatch
    ]
