from fastapi import APIRouter
from app.schemas.callback_schemas import SelfieCallbackRequest, PhotoCallbackRequest

router = APIRouter(prefix="/callback", tags=["Callbacks"])


@router.post("/selfie")
async def selfie_callback(request: SelfieCallbackRequest):
    selfie_id = request.selfie_id
    vector_id = request.vector_id
    success = request.success
    error_message: str | None = request.error_messsage

    if not success:
        print("ERROR: something went wrong processing the selfie")
        print(f"ERROR with message: {error_message}")
        # TODO:  add status as failed for that selfie
        return {"message": "updated error to db"}

    print(
        f"INFO recived callback for selfie id: {selfie_id} and vector_id: {vector_id}"
    )

    # TODO: add procssed for the seflie with id: seflie_id in the database
    # TODO: store the vector_id of the selfie in the selfie table

    return {"message": "updated to db"}


@router.post("/photo")
async def photo_callback(request: PhotoCallbackRequest):
    photo_id: str = request.photo_id
    event_id: str = request.event_id
    success: bool = request.success
    error_message: str | None = request.error_messsage

    if not success:
        print("ERROR: something went wrong processing the selfie")
        print(f"ERROR with message: {error_message}")
        # TODO:  add status as failed for that photo
        return {"message": "updated error to db"}

    print(f"INFO recived callback for photo id: {photo_id} in event: {event_id}")

    # TODO: add procssed for the photo with id: photo_id in the database

    return {"message": "updated to db"}
