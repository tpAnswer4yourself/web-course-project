from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID

from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# функция проверки пароля
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка соответствия пароля его хешу"""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

# генерация хеша пароля
def get_password_hash(password: str) -> str:
    """Генерация хеша пароля"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

# создание JWT-токена
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Генерация JWT-токена доступа"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# зависимость текущего пользователя
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Зависимость получения текущего авторизованного пользователя"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise credentials_exception
            
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# класс-зависимость, который определяет роли
class RoleChecker:
    """Зависимость для проверки ролей"""
    def __init__(self, allowed_role_ids: List[int]):
        self.allowed_role_ids = allowed_role_ids

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role_id not in self.allowed_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения данной операции"
            )
        return current_user