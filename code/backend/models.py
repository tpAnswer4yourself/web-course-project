import datetime
import uuid
import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .database import Base



# РОЛИ ПОЛЬЗОВАТЕЛЕЙ -----------------------------------------------------
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True) # айди роли
    name = Column(String(50), unique=True, nullable=False) # название роли


# ПОЛЬЗОВАТЕЛИ------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # айди пользователя
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=1) # внешний ключ на айди роли
    login = Column(String(50), unique=True, nullable=False, index=True) # логин
    email = Column(String(255), unique=True, nullable=False, index=True) # почта
    password_hash = Column(String(255), nullable=False) # хэш пароля
    
    first_name = Column(String(100), nullable=False) # имя
    last_name = Column(String(100), nullable=False) # фамилия
    middle_name = Column(String(100), nullable=True) # отчество
    phone_number = Column(String(20), nullable=True) # номер телефона
    created_at = Column(DateTime, default=datetime.datetime.utcnow) # дата создания аккаунта

    role = relationship("Role")
    products = relationship("Product", back_populates="vendor", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


# КАТЕГОРИИ--------------------------------------------------------------------------
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True) # айди категории
    name = Column(String(100), nullable=False, unique=True) # название категории

    products = relationship("Product", back_populates="category")


# ТОВАРЫ-------------------------------------------------------------------------
class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # айди товара
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) # внешний ключ на айди продавца данного товара
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False) # ключ на категорию товара
    
    title = Column(String(255), nullable=False, index=True) # название товара
    description = Column(Text, nullable=True) # его описание
    price = Column(Numeric(10, 2), nullable=False) # цена
    stock_quantity = Column(Integer, default=0, nullable=False) # остаток на складе
    image_url = Column(String(255), nullable=True) # ссылка на изображение
    
    attributes = Column(JSONB, nullable=False, default=dict) # атрибут JSONB для характеристик

    # Обратные связи
    vendor = relationship("User", back_populates="products")
    category = relationship("Category", back_populates="products")


# ЗАКАЗЫ ---------------------------------------------------------------------
class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # айди заказа
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) # ключ на покупателя, сделавшего заказ
    
    delivery_address = Column(Text, nullable=False) # адрес доставки
    delivery_date = Column(Date, nullable=False) # дата доставки
    total_price = Column(Numeric(10, 2), nullable=False) # общая сумма заказа
    created_at = Column(DateTime, default=datetime.datetime.utcnow) # дата создания

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")



# ПОЗИЦИИ ЗАКАЗОВ------------------------------------------------------------------

# вспомогательный класс для перечисляемого типа статуса позиции заказа
class OrderItemStatus(str, enum.Enum):
    processing = "В обработке"
    shipped = "В пути"
    delivered = "Доставлен"
    cancelled = "Отменен"
    
class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # айди
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False) # ключ на номер заказа
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False) # ключ на айди товар
    quantity = Column(Integer, nullable=False) # количество
    price_at_purchase = Column(Numeric(10, 2), nullable=False) # цена товара на момент покупки    
    status = Column(SQLEnum(OrderItemStatus, name="orderitemstatus"), default=OrderItemStatus.processing, nullable=False) # статус заказа

    order = relationship("Order", back_populates="items")
    product = relationship("Product")