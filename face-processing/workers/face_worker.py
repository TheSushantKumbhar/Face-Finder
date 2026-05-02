import json
from config import FACE_QUEUE_NAME
from rabbitmq.connection import create_channel
from services.pipeline import process_image
from utils.image_loader import download_image, image_cleanup
from services.vector_store import index


connection, channel = create_channel()


def callback(ch, method, properties, body):
    data = json.loads(body)
    img_url = data["r2URL"]
    photo_id = data["photoID"]
    event_id = data["eventID"]

    print(f"INFO received img url: {img_url}")
    print(f"INFO received photo id: {photo_id}")
    print(f"INFO received event id: {event_id}")

    img_path = None

    try:
        img_path = download_image(
            url=img_url,
            folder="temp",
        )

        print(f"INFO downloaded image to path: {img_path}")

        process_image(
            index=index,
            path=img_path,
            photo_id=photo_id,
            event_id=event_id,
        )

        print("\n")
        print(f"INFO indexed faces from \nphoto: {photo_id}\nurl: {img_url}")
        print("\n")

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"ERROR processing the image: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        image_cleanup(path=img_path)


channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=FACE_QUEUE_NAME, on_message_callback=callback)

print("INFO Face worker runnning...")
channel.start_consuming()
