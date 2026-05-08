import os
import uuid
import mimetypes
import requests
from config import IMAGES_FOLDER


def load_images():
    for filename in os.listdir(IMAGES_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            yield filename, os.path.join(IMAGES_FOLDER, filename)


def download_image(url: str, folder: str = "temp") -> str:
    os.makedirs(folder, exist_ok=True)

    res = requests.get(url, timeout=10)

    if res.status_code != 200:
        raise Exception(f"Failed to download image: {res.status_code}")

    # Get content type
    content_type = res.headers.get("Content-Type", "").split(";")[0]

    # Guess extension
    ext = mimetypes.guess_extension(content_type)

    # Fallback
    if not ext:
        ext = ".jpg"

    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(folder, filename)

    with open(path, "wb") as f:
        f.write(res.content)

    return path


def image_cleanup(path: str | None):
    if not path:
        print("ERROR no path passed to clean up function")
        return

    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception as e:
            print(f"WARNING failed to delete temp file: {e}")
