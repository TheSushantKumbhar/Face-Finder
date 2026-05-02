from rabbitmq.connection import create_channel
from config import (
    EXCHANGE_NAME,
    FACE_QUEUE_NAME,
    ROUTING_KEY_FACE,
    ROUTING_KEY_SELFIE,
    SELFIE_QUEUE_NAME,
)


connection, channel = create_channel()
print("INFO channel connection establised")

channel.queue_declare(queue=FACE_QUEUE_NAME, durable=True)
channel.queue_declare(queue=SELFIE_QUEUE_NAME, durable=True)
print("INFO queue declared")

channel.queue_bind(
    exchange=EXCHANGE_NAME,
    queue=FACE_QUEUE_NAME,
    routing_key=ROUTING_KEY_FACE,
)

channel.queue_bind(
    exchange=EXCHANGE_NAME,
    queue=SELFIE_QUEUE_NAME,
    routing_key=ROUTING_KEY_SELFIE,
)
print("INFO queues bound to the exchange")
