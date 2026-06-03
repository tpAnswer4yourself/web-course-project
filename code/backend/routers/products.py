import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.models import Product, Category, User
from app.schemas import ProductResponse, ProductCreate, ProductUpdate
from app.security import RoleChecker
from app.utils import save_upload_file, delete_uploaded_file

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# ЭНДПОИНТ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА
@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
def upload_product_image(file: UploadFile = File(...), current_user: User = Depends(RoleChecker([2, 3]))):
    """Загрузка изображения товара на сервер"""
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка, неподдерживаемый формат изображения."
        )
        
    file_url = save_upload_file(file)
    return {"image_url": file_url}


# ЭНДПОИНТ ПОЛУЧЕНИЯ СПИСКА ВСЕХ ТОВАРОВ
@router.get("/", response_model=List[ProductResponse])
def get_all_products(category_id: Optional[int] = None, search: Optional[str] = None, min_price: Optional[float] = None, max_price: Optional[float] = None, db: Session = Depends(get_db)):
    """Получение списка товаров"""
    query = db.query(Product)
    
    # блок фильтрации с поиском (по цене, и по категории)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.title.ilike(f"%{search}%"))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    return query.all()

# ЭНДПОИНТ ПОЛУЧЕНИЯ МОИХ ТОВАРОВ ДЯЛ ПРОДАВЦА
@router.get("/my-products", response_model=List[ProductResponse])
def get_my_products(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Получение списка товаров, принадлежащих текущему продавцу"""
    products = db.query(Product).filter(Product.vendor_id == current_user.id).all()
    return products

# ЭНДПОИНТ ПОЛУЧЕНИЯ ИНФОРМАЦИИ О КОНКРЕТНОМ ТОВАРЕ ПО АЙДИ
@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: UUID, db: Session = Depends(get_db)):
    """Получение информации о товаре"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )
    return product


# ЭНДПОИНТ СОЗДАНИЯ ТОВАРА
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Создание нового товара"""
    category = db.query(Category).filter(Category.id == product_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Указанная категория не существует"
        )

    new_product = Product(
        vendor_id=current_user.id,
        category_id=product_data.category_id,
        title=product_data.title,
        description=product_data.description,
        price=product_data.price,
        stock_quantity=product_data.stock_quantity,
        image_url=product_data.image_url,
        attributes=product_data.attributes
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


# ЭНДПОИНТ РЕДАКТИРОВАНИЯ ТОВАРА
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, product_data: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Редактирование параметров товара"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    # помимо зависимости от роли проверяем, что это собственный товар
    if current_user.role_id != 3 and product.vendor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете редактировать только собственные товары"
        )

    # проверка на существование категории
    if product_data.category_id is not None:
        category = db.query(Category).filter(Category.id == product_data.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Указанная категория не существует"
            )

    if product_data.image_url is not None and product.image_url and product.image_url != product_data.image_url:
        delete_uploaded_file(product.image_url)

    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


# ЭНДПОИНТ УДАЛЕНИЯ ТОВАРА
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Удаление товара"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    if current_user.role_id != 3 and product.vendor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете удалять только собственные товары"
        )

    if product.image_url:
        delete_uploaded_file(product.image_url)

    db.delete(product)
    db.commit()
    return None