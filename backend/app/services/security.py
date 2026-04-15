from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

import jwt
from jwt import PyJWTError

from datetime import datetime, timedelta
from fastapi import HTTPException, status

SECRET_KEY = "this_is_a_super_secure_key_with_more_than_32_chars"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        ph.verify(hashed, plain)
        return True
    except VerifyMismatchError:
        return False


def create_access_token(user_id):
    if isinstance(user_id, dict):
        raise ValueError("user_id should NOT be a dict. Pass user.id directly")

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except PyJWTError as e:
        print("JWT ERROR:", str(e))
        return None