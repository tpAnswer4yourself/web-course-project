from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date
from app.models import OrderItemStatus

# СХЕМЫ ДЛЯ АУТЕНТИФИКАЦИИ И ТОКЕНОВ ------------------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    role_id: Optional[int] = None
    

# СХЕМЫ ПОЛЬЗОВАТЕЛЕЙ --------------------------------------------------------------------
class UserBase(BaseModel):
    login: str = Field(..., max_length=50, description="Логин пользователя")
    email: EmailStr = Field(..., max_length=255, description="Электронная почта")
    first_name: str = Field(..., max_length=100, description="Имя")
    last_name: str = Field(..., max_length=100, description="Фамилия")
    middle_name: Optional[str] = Field(None, max_length=100, description="Отчество (при наличии)")
    phone_number: Optional[str] = Field(None, max_length=20, description="Контактный телефон")
    role_id: int = Field(default=1, description="ID роли пользователя (1 - Покупатель, 2 - Продавец, 3 - Администратор)")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Пароль")
    
class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100, description="Новое имя")
    last_name: Optional[str] = Field(None, max_length=100, description="Новая фамилия")
    middle_name: Optional[str] = Field(None, max_length=100, description="Новое отчество")
    phone_number: Optional[str] = Field(None, max_length=20, description="Новый телефон")
    role_id: Optional[int] = Field(None, description="ID новой роли")


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    
# СХЕМЫ КАТЕГОРИЙ ------------------------------------------------------------------------------
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100, description="Название категории")


class CategoryCreate(CategoryBase):
    pass


class CategoryEdit(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
    

# СХЕМЫ ТОВАРОВ -----------------------------------------------------------------------------------
class ProductBase(BaseModel):
    title: str = Field(..., max_length=255, description="Наименование товара")
    description: Optional[str] = Field(None, description="Подробное описание товара")
    price: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2, description="Стоимость товара")
    stock_quantity: int = Field(default=0, ge=0, description="Остаток на складе")
    image_url: Optional[str] = Field(None, max_length=255, description="Путь к изображению")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Динамические характеристики (JSON)")
    category_id: int = Field(..., description="ID категории товара")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, max_digits=10, decimal_places=2)
    stock_quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=255)
    attributes: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None

class VendorResponse(BaseModel):
    first_name: str
    last_name: str
    model_config = ConfigDict(from_attributes=True)
    
class ProductResponse(ProductBase):
    id: UUID
    vendor_id: UUID
    vendor: VendorResponse

    model_config = ConfigDict(from_attributes=True)
    

# СХЕМЫ ПОЗИЦИЙ ЗАКАЗОВ ----------------------------------------------------------------------------
class OrderItemBase(BaseModel):
    product_id: UUID = Field(..., description="ID приобретаемого товара")
    quantity: int = Field(..., gt=0, description="Количество единиц товара")

class OrderItemCreate(OrderItemBase):
    pass

class CompactProductResponse(BaseModel):
    title: str
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CompactUserResponse(BaseModel):
    first_name: str
    last_name: str
    login: str
    email: EmailStr
    phone_number: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CompactOrderResponse(BaseModel):
    delivery_address: str
    delivery_date: date
    customer: CompactUserResponse
    model_config = ConfigDict(from_attributes=True)
    
class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    product: CompactProductResponse
    order: CompactOrderResponse
    quantity: int
    price_at_purchase: Decimal
    status: OrderItemStatus  

    model_config = ConfigDict(from_attributes=True)
    
class OrderItemUpdateStatus(BaseModel):
    status: OrderItemStatus = Field(..., description="Новый статус позиции")
    
# СХЕМЫ ЗАКАЗОВ ПОЛЬЗОВАТЕЛЕЙ -------------------------------------------------------------------
class OrderCreate(BaseModel):
    delivery_address: str = Field(..., description="Адрес доставки")
    delivery_date: date = Field(..., description="Планируемая дата доставки")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Список позиций в заказе")

class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    customer: CompactUserResponse
    delivery_address: str
    delivery_date: date
    total_price: Decimal
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)