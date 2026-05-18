# dependencies/admin_dependency.py

from fastapi import Depends, HTTPException

from dependencies.get_user_dependency import get_current_user
from app.models.user import User, UserRole


async def get_current_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user