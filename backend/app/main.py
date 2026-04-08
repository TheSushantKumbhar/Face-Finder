from fastapi import FastAPI
from app.api.auth import auth


app = FastAPI(
    title="Face Finder API"
)

app.include_router(auth.router)