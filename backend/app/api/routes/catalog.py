from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.product import Product
from app.models.product_batch import ProductBatch
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.catalog import (
    ProductBatchCreate,
    ProductBatchRead,
    ProductCreate,
    ProductQuantityDecrease,
    ProductRead,
    ProductStatusUpdate,
    ProductUpdate,
)

router = APIRouter()


@router.get("/products", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)) -> list[ProductRead]:
    products = db.scalars(select(Product).order_by(Product.created_at.desc())).all()

    return [serialize_product(product) for product in products]


@router.post(
    "/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductRead:
    ensure_seller_or_admin(current_user)
    validate_product_prices(payload.price, payload.oldPrice)

    product_id = payload.id or str(uuid4())

    if db.get(Product, product_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product with this id already exists",
        )

    now = datetime.now(timezone.utc)
    product = Product(
        id=product_id,
        name=payload.name.strip(),
        tag=payload.tag,
        weight=payload.weight,
        price=payload.price,
        old_price=payload.oldPrice,
        image_url=payload.imageUrl,
        expiry_days=payload.expiryDays,
        is_verified=False,
        is_published=False,
        status="pending_review",
        seller_id=str(current_user.id),
        created_at=now,
        updated_at=now,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return serialize_product(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductRead:
    product = get_product_or_404(db, product_id)
    ensure_product_owner_or_admin(current_user, product)
    validate_product_prices(payload.price, payload.oldPrice)

    product.name = payload.name.strip()
    product.tag = payload.tag
    product.weight = payload.weight
    product.price = payload.price
    product.old_price = payload.oldPrice
    product.image_url = payload.imageUrl
    product.expiry_days = payload.expiryDays
    product.is_verified = False
    product.is_published = False
    product.status = "pending_review"
    product.updated_at = datetime.now(timezone.utc)

    db.add(product)
    db.commit()
    db.refresh(product)

    return serialize_product(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    product = get_product_or_404(db, product_id)
    ensure_product_owner_or_admin(current_user, product)

    db.delete(product)
    db.commit()


@router.patch("/products/{product_id}/status", response_model=ProductRead)
def update_product_status(
    product_id: str,
    payload: ProductStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductRead:
    ensure_admin(current_user)

    if payload.status not in {"pending_review", "approved", "rejected"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unknown product status",
        )

    product = get_product_or_404(db, product_id)
    product.status = payload.status
    product.is_verified = payload.status == "approved"
    product.is_published = payload.status == "approved"
    product.updated_at = datetime.now(timezone.utc)

    db.add(product)
    db.commit()
    db.refresh(product)

    return serialize_product(product)


@router.get("/product-batches", response_model=list[ProductBatchRead])
def list_product_batches(db: Session = Depends(get_db)) -> list[ProductBatchRead]:
    batches = db.scalars(
        select(ProductBatch).order_by(ProductBatch.created_at.desc()),
    ).all()

    return [serialize_product_batch(batch) for batch in batches]


@router.post(
    "/product-batches",
    response_model=ProductBatchRead,
    status_code=status.HTTP_201_CREATED,
)
def create_product_batch(
    payload: ProductBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProductBatchRead:
    ensure_seller_or_admin(current_user)

    product = get_product_or_404(db, payload.productId)
    ensure_product_owner_or_admin(current_user, product)

    batch_id = payload.id or str(uuid4())

    if db.get(ProductBatch, batch_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product batch with this id already exists",
        )

    now = datetime.now(timezone.utc)
    batch = ProductBatch(
        id=batch_id,
        product_id=product.id,
        seller_id=product.seller_id,
        manufactured_at=payload.manufacturedAt,
        quantity=payload.quantity,
        initial_quantity=payload.quantity,
        created_at=now,
        updated_at=now,
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)

    return serialize_product_batch(batch)


@router.delete(
    "/product-batches/{batch_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product_batch(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    batch = db.get(ProductBatch, batch_id)

    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if current_user.role != UserRole.ADMIN.value and batch.seller_id != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    db.delete(batch)
    db.commit()


@router.post("/product-batches/decrease", response_model=list[ProductBatchRead])
def decrease_product_quantity(
    payload: ProductQuantityDecrease,
    db: Session = Depends(get_db),
) -> list[ProductBatchRead]:
    write_off_product_quantity(db, payload.productId, payload.quantity)
    db.commit()

    return list_product_batches(db)


def write_off_product_quantity(
    db: Session,
    product_id: str,
    quantity: int,
) -> None:
    batches = db.scalars(
        select(ProductBatch)
        .where(ProductBatch.product_id == product_id, ProductBatch.quantity > 0)
        .order_by(ProductBatch.manufactured_at.asc(), ProductBatch.created_at.asc()),
    ).all()
    available_quantity = sum(batch.quantity for batch in batches)

    if available_quantity < quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Not enough product quantity",
        )

    quantity_to_write_off = quantity
    now = datetime.now(timezone.utc)

    for batch in batches:
        if quantity_to_write_off <= 0:
            break

        decrease_by = min(batch.quantity, quantity_to_write_off)
        batch.quantity -= decrease_by
        batch.updated_at = now
        quantity_to_write_off -= decrease_by
        db.add(batch)


def serialize_product(product: Product) -> ProductRead:
    return ProductRead(
        id=product.id,
        name=product.name,
        tag=product.tag,
        weight=product.weight,
        price=product.price,
        oldPrice=product.old_price,
        imageUrl=product.image_url,
        expiryDays=product.expiry_days,
        isVerified=product.is_verified,
        isPublished=product.is_published,
        status=product.status,
        sellerId=product.seller_id,
        createdAt=product.created_at.isoformat(),
        updatedAt=product.updated_at.isoformat(),
    )


def serialize_product_batch(batch: ProductBatch) -> ProductBatchRead:
    return ProductBatchRead(
        id=batch.id,
        productId=batch.product_id,
        sellerId=batch.seller_id,
        manufacturedAt=batch.manufactured_at,
        quantity=batch.quantity,
        initialQuantity=batch.initial_quantity,
        createdAt=batch.created_at.isoformat(),
        updatedAt=batch.updated_at.isoformat(),
    )


def get_product_or_404(db: Session, product_id: str) -> Product:
    product = db.get(Product, product_id)

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return product


def ensure_seller_or_admin(user: User) -> None:
    if user.role not in {UserRole.SELLER.value, UserRole.ADMIN.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)


def ensure_admin(user: User) -> None:
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)


def ensure_product_owner_or_admin(user: User, product: Product) -> None:
    if user.role == UserRole.ADMIN.value:
        return

    if product.seller_id != str(user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)


def validate_product_prices(price: float, old_price: float | None) -> None:
    if old_price is not None and old_price <= price:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Old price must be greater than price",
        )
