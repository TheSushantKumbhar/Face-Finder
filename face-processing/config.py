import os
from dotenv import load_dotenv


load_dotenv()


def get_env(key):
    value = os.getenv(key)
    if not value:
        raise ValueError(f"{key} env not found")
    return value


PINECONE_API_KEY = get_env("PINECONE_API_KEY")
INDEX_NAME = get_env("INDEX_NAME")
IMAGES_FOLDER = get_env("IMAGES_FOLDER")
MODEL_NAME = get_env("MODEL_NAME")
DETECTOR = get_env("DETECTOR")
DIMENSION = int(get_env("DIMENSION"))
THRESHOLD = 0.51
TOP_K = 50

NAMESPACE = "test_3"
