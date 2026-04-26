import os
import uuid
import requests
from config import IMAGES_FOLDER


def load_images():
    for filename in os.listdir(IMAGES_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            yield filename, os.path.join(IMAGES_FOLDER, filename)


def download_image(url: str, folder: str = "temp") -> str:
    os.makedirs(folder, exist_ok=True)

    filename = f"{uuid.uuid4()}.jpg"
    path = os.path.join(folder, filename)

    res = requests.get(url)

    if res.status_code != 200:
        raise Exception(f"Failed to download image: {res.status_code}")

    with open(path, "wb") as f:
        f.write(res.content)

    return path
