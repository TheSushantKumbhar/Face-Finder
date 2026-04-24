from services.pipeline import process_image
from services.vector_store import init_index
from utils.image_loader import load_images


def main():
    index = init_index()
    namespace = "test_3"
    face_counter = 0

    for filename, path in load_images():
        print(f"INFO processing {filename}")

        face_counter = process_image(
            index=index,
            path=path,
            filename=filename,
            face_counter=face_counter,
            namespace=namespace,
        )

    print(f"INFO indexed {face_counter} faces")


if __name__ == "__main__":
    main()
