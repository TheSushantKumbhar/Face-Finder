from pydantic.main import BaseModel


class QueryRequest(BaseModel):
    vector_id: str
    event_id: str
