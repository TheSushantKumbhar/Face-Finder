from fastapi import APIRouter,Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from dependencies.db_dependency import get_db
from app.models.user import User,UserRole
from app.schemas.user_schemas import UserCreate, UserLogin, UserResponse
from app.services.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/signup")
async def signup(user : UserCreate, db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(User).where(User.email == user.email))
    exsisting_user = result.scalar_one_or_none()

    if exsisting_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        username = user.username,
        email = user.email,
        password = hash_password(user.password),
        role = user.role
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"message" : "user created successfully"}


@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    exsisting_user = result.scalar_one_or_none()

    if not exsisting_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not verify_password(user.password, exsisting_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token(exsisting_user.id)

    return { 
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout():
    return {"message": "Logout successful"}




