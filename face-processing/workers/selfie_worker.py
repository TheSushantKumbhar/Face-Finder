import json

from rabbitmq.connection import create_channel
from config import SELFIE_QUEUE_NAME


connection, channel = create_channel()


def selfie_callback(ch, method, properties, body):
    data = json.loads(body)
    print(data)


channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=SELFIE_QUEUE_NAME, on_message_callback=selfie_callback)

print("INFO Face worker runnning...")
channel.start_consuming()
