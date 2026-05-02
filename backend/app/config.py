import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_env(key):
    value = os.getenv(key)
    if not value:
        raise ValueError(f"{key} env not found")
    return value


RABBIT_MQ_URL = get_env("RABBITMQ_URL")
EXCHANGE_NAME = get_env("RABBITMQ_EXCHANGE_NAME")

ROUTING_KEY_FACE = get_env("ROUTING_KEY_FACE")
ROUTING_KEY_SELFIE = get_env("ROUTING_KEY_SELFIE")
