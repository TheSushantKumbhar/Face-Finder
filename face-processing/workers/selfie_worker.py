import json
from services.callback import send_selfie_callback
from services.vector_store import index
from rabbitmq.connection import create_channel
from config import SELFIE_QUEUE_NAME
from services.pipeline import process_selfie
from utils.image_loader import download_image, image_cleanup


connection, channel = create_channel()


def selfie_callback(ch, method, properties, body):
    data = json.loads(body)

    img_url = data["r2URL"]
    selfie_id = data["selfieID"]

    print(f"INFO received img url: {img_url}")
    print(f"INFO received selfie id: {selfie_id}")

    img_path = None

    try:
        img_path = download_image(
            url=img_url,
            folder="temp",
        )

        print(f"INFO downloaded image to path: {img_path}")

        vector_id, success = process_selfie(
            index=index,
            path=img_path,
            selfie_id=selfie_id,
        )

        print("\n")
        print(f"INFO indexed faces from \nselfie id: {selfie_id}\nurl: {img_url}")
        print("\n")

        if vector_id == None:
            send_selfie_callback(
                selfie_id=selfie_id,
                success=False,
                vector_id="",
                error_message="No vector id",
            )
            return

        res = send_selfie_callback(
            selfie_id=selfie_id,
            success=success,
            vector_id=vector_id,
            error_message=None,
        )
        print("INFO Selfie callback response:", res)

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"ERROR processing the selfie: {e}")
        send_selfie_callback(
            selfie_id=selfie_id,
            success=False,
            vector_id="",
            error_message=f"Something went wrong: {e}",
        )
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        image_cleanup(path=img_path)


channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=SELFIE_QUEUE_NAME, on_message_callback=selfie_callback)

print("INFO Selfie worker runnning...")
channel.start_consuming()
