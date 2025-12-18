from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from jose import JWTError,jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.models.models import UserReqRes, Token, LoginRequest
from app.crud.users_crud import get_user_by_id
from dotenv import load_dotenv
import os
load_dotenv()



SECRET_KEY = os.getenv("SECRET_KEY")  # Secret key for JWT encoding/decoding
ALGORITHM = os.getenv("ALGORITHM")      # Algorithm used for JWT
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))                       # Token expiry duration

security = HTTPBearer()


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {"sub": subject}
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(e_id: int, password: str) -> Optional[UserReqRes]:
    try:
        user = get_user_by_id(e_id)
    except Exception:
        return None
    # users_crud returns UserReqRes with password field
    if not user or user.password != password:
        return None
    return user


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserReqRes:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        user = get_user_by_id(int(user_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user