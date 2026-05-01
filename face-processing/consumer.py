import pika
import json
from config import get_env
from services.pipeline import process_image
from services.vector_store import init_index
from utils.image_loader import download_image, image_cleanup

RABBIT_MQ_URL = get_env("RABBITMQ_URL")
EXCHANGE_NAME = get_env("RABBITMQ_EXCHANGE_NAME")
QUEUE_NAME = get_env("RABBITMQ_QUEUE_NAME")
ROUTING_KEY = get_env("RABBITMQ_ROUTING_KEY")
index = init_index()

connection_params = pika.URLParameters(RABBIT_MQ_URL)
connection = pika.BlockingConnection(connection_params)

channel = connection.channel()

# exchange
channel.exchange_declare(
    exchange=EXCHANGE_NAME,
    exchange_type="direct",
    durable=True,
)

channel.queue_declare(queue=QUEUE_NAME, durable=True)

channel.queue_bind(
    exchange=EXCHANGE_NAME,
    queue=QUEUE_NAME,
    routing_key=ROUTING_KEY,
)


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
    finally:
        image_cleanup(path=img_path)


channel.basic_qos(prefetch_count=1)

channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

print("INFO Waiting for messages...")
channel.start_consuming()
