from fastapi import FastAPI
from app.api.auth import auth
from app.api.event_routes import events_routes
# from app.api.photo_routes import photo_routes
from app.api.auth.oauth import router as oauth_router  
from app.api.upload_routes.upload_routes import router as upload_router
from app.api.selfie_routes.selfie_routes import router as selfie_router

from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Face Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key="super-secret-key"   
)

app.include_router(auth.router)
app.include_router(events_routes.router)
# app.include_router(photo_routes.router)
app.include_router(oauth_router) 
app.include_router(upload_router)
app.include_router(selfie_router)