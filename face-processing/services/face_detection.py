from deepface import DeepFace
from config import MODEL_NAME, DETECTOR


def extract_faces(image_path):
    return DeepFace.represent(
        img_path=image_path,
        model_name=MODEL_NAME,
        detector_backend=DETECTOR,
        enforce_detection=True,
        align=True,
    )
