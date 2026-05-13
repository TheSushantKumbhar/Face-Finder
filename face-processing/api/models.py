from typing import List
from pydantic.main import BaseModel


class QueryRequest(BaseModel):
    vector_id: str
    event_id: str


class QueryMultipleRequest(BaseModel):
    front_vector_id: str
    left_vector_id: str
    right_vector_id: str

    event_id: str


class QueryMatchResponse(BaseModel):
    photo_id: str
    score: float


class QueryResponse(BaseModel):
    status: str
    matches: List[QueryMatchResponse]
