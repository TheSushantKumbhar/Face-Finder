from app.config import ROUTING_KEY_SELFIE
from app.services.producer import Producer


payload = {
    "selfieID": "idk_test_id",
    "r2URL": "https://pub-450f47b52ec8475784bebb5ca720c2ab.r2.dev/selfies/e7c731b5-dc78-498a-9e0c-d6be0437b73a/front.jpeg",
}

producer = Producer()
producer.publish(routing_key=ROUTING_KEY_SELFIE, msg=payload)
print("INFO sent message to exchange")
producer.close()
