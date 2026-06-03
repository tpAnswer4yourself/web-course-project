import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.database import get_db
from app.models import Order, OrderItem, Product, User, Category, OrderItemStatus
from app.security import RoleChecker

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ЭНДПОИНТ ПОЛУЧЕНИЯ СТАТИСТИКИ ДЛЯ ДАШБОРДА
@router.get("/dashboard", response_model=Dict[str, Any])
def get_seller_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Получение агрегированных статистических показателей для дашборда продавца"""
    
    # выручка продавца расчитывается как сумма произведений цены покупки на количество для всех неотмененных позиций
    revenue_query = db.query(
        func.sum(OrderItem.price_at_purchase * OrderItem.quantity)
    ).join(Product).filter(
        Product.vendor_id == current_user.id,
        OrderItem.status != OrderItemStatus.cancelled
    ).scalar()
    
    total_revenue = float(revenue_query) if revenue_query else 0.0

    # кол-во уникальных заказов, где содержится хотя бы один товар этого продавца
    orders_count = db.query(
        func.count(func.distinct(OrderItem.order_id))
    ).join(Product).filter(
        Product.vendor_id == current_user.id
    ).scalar()
    
    total_orders = orders_count if orders_count else 0

    # общее кол-во проданных товаров
    items_sold_count = db.query(
        func.sum(OrderItem.quantity)
    ).join(Product).filter(
        Product.vendor_id == current_user.id,
        OrderItem.status != OrderItemStatus.cancelled
    ).scalar()
    
    total_items_sold = int(items_sold_count) if items_sold_count else 0

    # продажи по категориям
    category_stats = db.query(
        Category.name,
        func.sum(OrderItem.quantity).label("sold_qty"),
        func.sum(OrderItem.price_at_purchase * OrderItem.quantity).label("revenue")
    ).join(Product, Product.id == OrderItem.product_id)\
     .join(Category, Category.id == Product.category_id)\
     .filter(
         Product.vendor_id == current_user.id,
         OrderItem.status != OrderItemStatus.cancelled
     ).group_by(Category.name).all()
    
    # преобразование массива кортежей в JSON-обьект / словарь
    sales_by_category = [
        {"category": name, "quantity_sold": int(qty), "revenue": float(rev)}
        for name, qty, rev in category_stats
    ]

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_items_sold": total_items_sold,
        "sales_by_category": sales_by_category
    }


# ЭНДПОИНТ ВЫГРУЗКИ ОТЧЕТА
@router.get("/export-csv")
def export_sales_to_csv(db: Session = Depends(get_db), current_user: User = Depends(RoleChecker([2, 3]))):
    """Генерация CSV файла с подробной детализацией всех продаж текущего продавца."""
    # все продажи текущего продавца
    sales = db.query(
        Order.id,
        Order.created_at,
        Product.title,
        OrderItem.quantity,
        OrderItem.price_at_purchase,
        OrderItem.status
    ).join(OrderItem, OrderItem.order_id == Order.id)\
     .join(Product, Product.id == OrderItem.product_id)\
     .filter(Product.vendor_id == current_user.id)\
     .order_by(Order.created_at.desc()).all()

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=';')
    writer.writerow([
        "Дата заказа", 
        "Наименование товара", 
        "Количество (шт)", 
        "Цена за единицу (руб)", 
        "Сумма (руб)", 
        "Статус доставки"
    ])
    
    total_revenue = 0.0 # общая сумма выручки
    total_items_sold = 0 # кол-во проданных товаров
    unique_orders = set() # уникальные заказы

    # заполнение таблицы
    for order_id, order_date, title, qty, price, status_enum in sales:
        total_sum = float(price * qty)
        formatted_date = order_date.strftime("%Y-%m-%d %H:%M:%S")
        unique_orders.add(order_id)
        
        # подсчет выручки и количества проданных единиц товаров, не учитывая отмененные
        if status_enum != OrderItemStatus.cancelled:
            total_revenue += total_sum
            total_items_sold += qty

        writer.writerow([
            formatted_date, 
            title, 
            qty, 
            float(price), 
            total_sum, 
            status_enum.value
        ])

    # блок с итоговыми показателями
    writer.writerow([])
    writer.writerow(["ИТОГОВЫЕ ПОКАЗАТЕЛИ ЗА ВСЕ ВРЕМЯ:"])
    writer.writerow(["Всего уникальных заказов:", len(unique_orders)])
    writer.writerow(["Заказано товаров:", total_items_sold])
    writer.writerow(["Общая выручка:", f"{total_revenue} руб."])

    output.seek(0)
    headers = {'Content-Disposition': 'attachment; filename="sales_report.csv"'}
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type='text/csv',
        headers=headers
    )