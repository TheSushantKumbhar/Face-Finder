from fastapi import FastAPI
from app.api.auth import auth
from app.api.event_routes import events_routes


app = FastAPI(
    title="Face Finder API"
)

app.include_router(auth.router)
app.include_router(events_routes.router)
