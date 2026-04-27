import pika
import json
from config import get_env

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

message = {
    "eventID": "event123",
    "photoID": "1",
    "r2URL": "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev/test/event123/2.jpeg",
}

channel.basic_publish(
    exchange=EXCHANGE_NAME,
    routing_key=ROUTING_KEY,
    body=json.dumps(message),
    properties=pika.BasicProperties(delivery_mode=2),
)

print(f"INFO sent message:\n {message}")
connection.close()
