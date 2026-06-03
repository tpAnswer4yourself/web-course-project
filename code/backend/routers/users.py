from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.models import User
from app.schemas import UserResponse, UserUpdate
from app.security import get_current_user, RoleChecker

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# ЭНДПОИНТ ПОЛУЧЕНИЯ СПИСКА ВСЕХ ПОЛЬЗОВАТЕЛЕЙ СИСТЕМЫ
@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([3]))):
    """Получение списка всех пользователей"""
    users = db.query(User).all()
    return users

# ЭНДПОИНТ ПОЛУЧЕНИЯ ЮЗЕРА ПО ЕГО АЙДИ
@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Получение пользователя по ID"""
    if current_user.role_id != 3 and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра чужого профиля"
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user

# ЭНДПОИНТ ИЗМЕНЕНИЯ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
@router.patch("/{user_id}", response_model=UserResponse)
def update_user_profile(user_id: UUID, user_data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Обновление личных данных профиля"""
    if current_user.id != user_id and current_user.role_id != 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете редактировать только свой собственный профиль"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
        
    update_data = user_data.model_dump(exclude_unset=True) # обновление только тех полей, которые прислал юзер
    
    if "role_id" in update_data and current_user.role_id != 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете самостоятельно изменить свою роль"
        )
        
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user

# ЭНДПОИНТ УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([3]))):
    """Удаление пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
        
    db.delete(user)
    db.commit()
    return None