from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from urllib.parse import urlencode

from app.services.oauth_service import oauth_service
from dependencies.db_dependency import get_db
from app.models.user import User, UserRole
from app.services.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/google")
async def login_with_google(request: Request, app_redirect_uri: str = "facefinder://oauth"):
    # Store the app's redirect URI in session so the callback can use it
    request.session["app_redirect_uri"] = app_redirect_uri
    redirect_uri = request.url_for("google_callback")
    return await oauth_service.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth_service.google.authorize_access_token(request)

    resp = await oauth_service.google.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        token=token
    )
    user_info = resp.json()

    email = user_info["email"]
    username = user_info["name"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # New user — create with default role, then ask to pick
        user = User(
            email=email,
            username=username,
            password="",
            role=UserRole.user  # default, will be updated after role selection
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Redirect back to app with new-user flag
        app_redirect = request.session.get("app_redirect_uri", "facefinder://oauth")
        params = urlencode({
            "is_new_user": "true",
            "user_id": str(user.id),
            "email": email,
            "username": username,
        })
        return RedirectResponse(url=f"{app_redirect}?{params}")

    # Existing user — generate JWT and redirect back
    app_redirect = request.session.get("app_redirect_uri", "facefinder://oauth")
    jwt_token = create_access_token(user.id)
    params = urlencode({
        "is_new_user": "false",
        "access_token": jwt_token,
        "role": user.role.value if user.role else "user",
        "username": user.username,
    })
    return RedirectResponse(url=f"{app_redirect}?{params}")


@router.post("/select-role")
async def select_role(
    user_id: str,
    role: str,
    db: AsyncSession = Depends(get_db)
):
    # Validate role
    if role not in ["user", "organizer"]:
        return {"error": "Invalid role. Must be 'user' or 'organizer'"}

    # Get user by UUID
    import uuid
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        return {"error": "Invalid user_id format"}

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()

    if not user:
        return {"error": "User not found"}

    # Update role
    user.role = UserRole(role)
    await db.commit()
    await db.refresh(user)

    # Generate JWT
    jwt_token = create_access_token(user.id)

    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "role": user.role.value,
        "username": user.username,
    }