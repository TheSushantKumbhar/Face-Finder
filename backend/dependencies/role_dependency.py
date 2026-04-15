from fastapi import FastAPI, Depends, HTTPException
from app.models.user import User
from dependencies.get_user_dependency import get_current_user

def require_organizer(current_user : User = Depends(get_current_user)):
    if current_user.role not in ["organizer","admin"]:
        raise HTTPException(
            status_code=403,
            detail="only organizer allowed to create events. Get verified now"
            )
    return current_user

