import pika
import json
from config import get_env
from services.pipeline import process_image
from services.vector_store import init_index
from utils.image_loader import download_image

RABBIT_MQ_URL = get_env("RABBITMQ_URL")
EXCHANGE_NAME = get_env("RABBITMQ_EXCHANGE_NAME")
QUEUE_NAME = get_env("RABBITMQ_QUEUE_NAME")
ROUTING_KEY = get_env("RABBITMQ_ROUTING_KEY")

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
    index = init_index()
    data = json.loads(body)

    print(f"INFO Received:\n {data}")

    img_url = data["r2URL"]
    photo_id = data["photoID"]
    event_id = data["eventID"]

    img_path = download_image(
        url=img_url,
        folder="temp",
    )

    process_image(
        index=index,
        path=img_path,
        filename=photo_id,
        namespace=event_id,
    )

    print(f"INFO indexed faces from \nphoto: {photo_id}\nurl: {img_url}")

    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_qos(prefetch_count=1)

channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

print("Waiting for messages...")
channel.start_consuming()
