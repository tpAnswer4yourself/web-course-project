from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal, get_db
from app.models import Role, User
from app.schemas import UserCreate, UserResponse, Token
from app.security import (get_password_hash, verify_password, create_access_token, get_current_user)

from fastapi.staticfiles import StaticFiles
import os
from app.routers import users, categories, products, orders, analytics


# АВТОСОЗДАНИЕ РОЛЕЙ
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        required_roles = {
            1: "Покупатель",
            2: "Продавец",
            3: "Администратор"
        }
        
        for r_id, r_name in required_roles.items():
            existing_role = db.query(Role).filter(Role.id == r_id).first()
            if not existing_role:
                new_role = Role(id=r_id, name=r_name)
                db.add(new_role)
                
        db.commit()
    except Exception as e:
        print(f"Ошибка автогенерации ролей: {e}")
        db.rollback()
    finally:
        db.close()
        
    yield

app = FastAPI(title="Marketplace API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# папка uploads для хранения изображений товаров
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# подключение роутов
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(analytics.router)


# эндпоинт регистрации нового пользователя
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    existing_login = db.query(User).filter(User.login == user_in.login).first()
    if existing_login:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким логином уже зарегистрирован"
        )
        
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с такой электронной почтой уже зарегистрирован"
        )

    if user_in.role_id not in [1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Указана несуществующая роль"
        )

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        login=user_in.login,
        email=user_in.email,
        password_hash=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        middle_name=user_in.middle_name,
        phone_number=user_in.phone_number,
        role_id=user_in.role_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

#эндпоинт авторизации пользователя
@app.post("/auth/login", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Авторизация пользователя и получение токена доступа (OAuth2)"""
    user = db.query(User).filter((User.login == form_data.username) | (User.email == form_data.username)).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)}) # JWT токен
    return {"access_token": access_token, "token_type": "bearer"} # отправляем клиенту заголовки

# эндпоинт пользователя для получения информации о себе
@app.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def read_users_me(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем авторизованном пользователе"""
    return current_user


@app.get("/", tags=["System"])
def read_root():
    return {"message": "TechShop"}


@app.get("/healthcheck", tags=["System"])
def healthcheck(db: Session = Depends(get_db)):
    """Подключение к базе данных"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка подключения к БД: {str(e)}"
        )