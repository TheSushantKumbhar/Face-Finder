import requests


BASE_URL = "http://localhost:8000/callback"


def send_selfie_callback(
    selfie_id: str,
    success: bool,
    vector_id: str,
    error_message: str | None = None,
):
    payload = {
        "selfie_id": selfie_id,
        "vector_id": vector_id,
        "success": success,
        "error_messsage": error_message,
    }

    response = requests.post(
        f"{BASE_URL}/selfie",
        json=payload,
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


def send_photo_callback(
    photo_id: str,
    event_id: str,
    success: bool,
    error_message: str | None = None,
):
    payload = {
        "photo_id": photo_id,
        "event_id": event_id,
        "success": success,
        "error_messsage": error_message,
    }

    response = requests.post(
        f"{BASE_URL}/photo",
        json=payload,
        timeout=10,
    )

    response.raise_for_status()

    return response.json()
