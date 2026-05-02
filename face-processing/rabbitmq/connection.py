import pika

from config import EXCHANGE_NAME, RABBIT_MQ_URL


def create_channel():
    connection = pika.BlockingConnection(
        pika.URLParameters(RABBIT_MQ_URL),
    )

    channel = connection.channel()

    channel.exchange_declare(
        exchange=EXCHANGE_NAME,
        exchange_type="direct",
        durable=True,
    )

    return connection, channel
