from pydantic import BaseModel


class SelfieCallbackRequest(BaseModel):
    selfie_id: str
    vector_id: str
    success: bool
    error_messsage: str | None = None


class PhotoCallbackRequest(BaseModel):
    photo_id: str
    event_id: str
    success: bool
    error_messsage: str | None = None
