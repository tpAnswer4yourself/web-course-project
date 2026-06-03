from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Category, User
from app.schemas import CategoryResponse, CategoryCreate, CategoryEdit
from app.security import RoleChecker

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# ЭНДПОИНТ ПОЛУЧЕНИЯ ВСЕХ КАТЕГОРИЙ СПИСКОМ
@router.get("/", response_model=List[CategoryResponse])
def get_all_categories(db: Session = Depends(get_db)):
    """Получение списка всех категорий"""
    categories = db.query(Category).all()
    return categories

# ЭНДПОИНТ СОЗДАНИЯ КАТЕГОРИИ
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_data: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([3]))):
    """Создание новой категории"""
    existing_category = db.query(Category).filter(Category.name == category_data.name).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Категория с таким названием уже существует"
        )

    new_category = Category(name=category_data.name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

# ЭНДПОИНТ ИЗМЕНЕНИЯ НАЗВАНИЯ КАТЕГОРИИ
@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category_data: CategoryEdit, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([3]))):
    """Редактирование категории"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )
        
    if category_data.name != category.name:
        name_conflict = db.query(Category).filter(Category.name == category_data.name).first()
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Категория с таким названием уже существует"
            )

    category.name = category_data.name
    db.commit()
    db.refresh(category)
    return category

# ЭНДПОИНТ УДАЛЕНИЯ КАТЕГОРИИ
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db),current_user: User = Depends(RoleChecker([3]))):
    """Удаление категории"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )

    # если есть товары в этой категории, удалить не получится
    if len(category.products) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить категорию, в которой содержатся товары."
        )

    db.delete(category)
    db.commit()
    return None