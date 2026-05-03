import json
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db
from app.api.routes.catalog import (
    get_product_or_404,
    serialize_product,
    write_off_product_quantity,
)
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.orders import CustomerInfo, OrderCreate, OrderItemRead, OrderRead

router = APIRouter()


@router.get("/orders", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)) -> list[OrderRead]:
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc()),
    ).all()

    return [serialize_order(order) for order in orders]


@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
) -> OrderRead:
    order_id = payload.id or str(uuid4())

    if db.get(Order, order_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order with this id already exists",
        )

    products_by_id: dict[str, Product] = {}

    for item in payload.items:
        product = get_product_or_404(db, item.product.id)
        products_by_id[product.id] = product

    for item in payload.items:
        write_off_product_quantity(db, item.product.id, item.quantity)

    total_price = sum(
        products_by_id[item.product.id].price * item.quantity
        for item in payload.items
    )
    total_quantity = sum(item.quantity for item in payload.items)
    now = datetime.now(timezone.utc)
    order = Order(
        id=order_id,
        customer_name=payload.customer.name.strip(),
        customer_phone=payload.customer.phone.strip(),
        customer_address=payload.customer.address.strip(),
        customer_comment=payload.customer.comment.strip(),
        total_price=total_price,
        total_quantity=total_quantity,
        status="created",
        created_at=now,
    )

    for item in payload.items:
        product = products_by_id[item.product.id]
        product_snapshot = serialize_product(product).model_dump_json()
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_snapshot=product_snapshot,
                quantity=item.quantity,
                price=product.price,
            ),
        )

    db.add(order)
    db.commit()
    db.refresh(order)

    return serialize_order(order)


@router.patch("/orders/{order_id}/cancel", response_model=OrderRead)
def cancel_order(
    order_id: str,
    db: Session = Depends(get_db),
) -> OrderRead:
    order = get_order_or_404(db, order_id)
    order.status = "cancelled"

    db.add(order)
    db.commit()
    db.refresh(order)

    return serialize_order(order)


@router.delete("/orders", status_code=status.HTTP_204_NO_CONTENT)
def clear_orders(db: Session = Depends(get_db)) -> None:
    db.execute(delete(OrderItem))
    db.execute(delete(Order))
    db.commit()


def serialize_order(order: Order) -> OrderRead:
    return OrderRead(
        id=order.id,
        createdAt=order.created_at.isoformat(),
        customer=CustomerInfo(
            name=order.customer_name,
            phone=order.customer_phone,
            address=order.customer_address,
            comment=order.customer_comment,
        ),
        items=[
            OrderItemRead(
                product=json.loads(item.product_snapshot),
                quantity=item.quantity,
            )
            for item in order.items
        ],
        totalPrice=order.total_price,
        totalQuantity=order.total_quantity,
        status=order.status,
    )


def get_order_or_404(db: Session, order_id: str) -> Order:
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items)),
    )

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return order
