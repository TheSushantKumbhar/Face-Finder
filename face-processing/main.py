from config import NAMESPACE
from services.pipeline import process_image
from services.vector_store import init_index
from utils.image_loader import load_images


def main():
    index = init_index()

    for filename, path in load_images():
        print(f"INFO processing {filename}")

        process_image(
            index=index,
            path=path,
            photo_id=filename,
            event_id=NAMESPACE,
        )


if __name__ == "__main__":
    main()
