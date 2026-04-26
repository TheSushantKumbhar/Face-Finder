import pika
import json
from config import get_env
from utils.image_loader import download_image

RABBIT_MQ_HOST = get_env("RABBITMQ_HOST")
EXCHANGE_NAME = get_env("RABBITMQ_EXCHANGE_NAME")
QUEUE_NAME = get_env("RABBITMQ_QUEUE_NAME")
ROUTING_KEY = get_env("RABBITMQ_ROUTING_KEY")

connection_params = pika.ConnectionParameters(RABBIT_MQ_HOST)
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
    print(f"INFO Received:\n {data}")

    img_path = download_image(
        url=data["r2URL"],
        folder="temp",
    )

    print(img_path)

    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_qos(prefetch_count=1)

channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

print("Waiting for messages...")
channel.start_consuming()
