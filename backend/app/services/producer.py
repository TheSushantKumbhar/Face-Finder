import pika
import json
from app.config import RABBIT_MQ_URL, EXCHANGE_NAME


class Producer:
    def __init__(self):
        params = pika.URLParameters(RABBIT_MQ_URL)
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()

        self.channel.exchange_declare(
            exchange=EXCHANGE_NAME,
            exchange_type="direct",
            durable=True,
        )

    def publish(self, routing_key: str, msg: dict):
        self.channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=json.dumps(msg),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        print(f"INFO sent message:\n {msg}")

    def close(self):
        self.connection.close()
