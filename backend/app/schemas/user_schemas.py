from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserCreate(BaseModel):
    username : str
    email : EmailStr
    password : str
    role : UserRole

class UserLogin(BaseModel):
    email : EmailStr
    password : str


class UserResponse(BaseModel):
    id : str
    username : str
    email : EmailStr
    role : str

    class Config : 
        from_attributes = True