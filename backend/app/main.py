from fastapi import FastAPI
from app.api.auth import auth
from app.api.event_routes import events_routes
from app.api.photo_routes import photo_routes
from app.api.auth.oauth import router as oauth_router  
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI(title="Face Finder API")

app.add_middleware(
    SessionMiddleware,
    secret_key="super-secret-key"   
)

app.include_router(auth.router)
app.include_router(events_routes.router)
app.include_router(photo_routes.router)
app.include_router(oauth_router) 