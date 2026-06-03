from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.models import Order, OrderItem, Product, User, OrderItemStatus
from app.schemas import OrderCreate, OrderResponse, OrderItemResponse, OrderItemUpdateStatus
from app.security import RoleChecker

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# ЭНДПОИНТ ОФОРМЛЕНИЯ ЗАКАЗА
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([1,2,3]))):
    """Оформление заказа"""
    total_price = 0 # общая сумма заказа
    order_items_to_create = [] # массив товаров в заказе

    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Товар с ID {item.product_id} не найден."
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Недостаточно товара '{product.title}' на складе."
            )

        product.stock_quantity -= item.quantity # вычитаем остаток у продукта
        item_total = product.price * item.quantity # расчет суммы товара в чеке
        total_price += item_total # добавляем к заказу клиента расчитанную сумму за товар

        order_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price_at_purchase=product.price,
            status=OrderItemStatus.processing
        )
        order_items_to_create.append(order_item)

    new_order = Order(
        customer_id=current_user.id,
        delivery_address=order_data.delivery_address,
        delivery_date=order_data.delivery_date,
        total_price=total_price
    )
    
    # записываем заказ в бд и получаем ID заказа
    db.add(new_order)
    db.flush()
    
    # присваиваем позициям в заказе айдишник созданного заказа
    for order_item in order_items_to_create:
        order_item.order_id = new_order.id
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return new_order


# ЭНДПОИНТ ПОЛУЧЕНИЯ МОИХ ЗАКАЗОВ
@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([1, 2, 3]))):
    """Получение истории всех оформленных заказов текущего пользователя"""
    orders = db.query(Order).filter(Order.customer_id == current_user.id).all()
    return orders


# ЭНДПОИТ ДЛЯ ПРОДАВЦА, ПОЛУЧЕНИЕ СПИСКА МОИХ ТОВАРОВ, КОТОРЫЕ ЗАКАЗАЛ ПОЛЬЗОВАТЕЛЬ
@router.get("/seller-items", response_model=List[OrderItemResponse])
def get_seller_order_items(db: Session = Depends(get_db),current_user: User = Depends(RoleChecker([2, 3]))):
    """Получение списка позиций заказов, содержащих только товары текущего продавца."""
    items = db.query(OrderItem).join(Product).filter(Product.vendor_id == current_user.id).all()
    return items


# ЭНДПОИНТ ДЛЯ ИЗМЕНЕНИЯ СТАТУСА ЗАКАЗАННОГО ТОВАРА
@router.patch("/items/{order_item_id}/status", response_model=OrderItemResponse)
def update_order_item_status(order_item_id: UUID, status_data: OrderItemUpdateStatus, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Изменение статуса конкретной позиции заказа."""
    order_item = db.query(OrderItem).filter(OrderItem.id == order_item_id).first()
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Позиция заказа не найдена."
        )

    product_owner = db.query(Product).filter(Product.id == order_item.product_id).first()
    
    if current_user.role_id != 3 and product_owner.vendor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете изменять статус доставки только для своих собственных товаров."
        )

    order_item.status = status_data.status
    db.commit()
    db.refresh(order_item)
    return order_item


# ЭНДПОИНТ ДЛЯ ПРОСМОТРА ВСЕХ ЗАКАЗОВ В СИСТЕМЕ
@router.get("/", response_model=List[OrderResponse])
def get_all_orders(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([3]))):
    """Получение списка всех заказов в системе"""
    orders = db.query(Order).all()
    return orders