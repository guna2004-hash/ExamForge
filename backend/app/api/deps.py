from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core import security
from app.database.session import get_db
from app.models.models import User

# OAuth2 login url
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login-json"  # OAuth2PasswordRequestForm compatibility
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_email = security.decode_access_token(token)
    if user_email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_teacher(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in ["Teacher", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges (Teacher/Admin required)",
        )
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have Admin privileges",
        )
    return current_user
