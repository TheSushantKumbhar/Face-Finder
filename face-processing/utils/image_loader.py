import os
from config import IMAGES_FOLDER


def load_images():
    for filename in os.listdir(IMAGES_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            yield filename, os.path.join(IMAGES_FOLDER, filename)
