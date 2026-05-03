from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.product import Product
from app.models.product_batch import ProductBatch
from app.models.user import User
from app.models.user_role import UserRole


def seed_admin_user() -> None:
    admin_email = settings.admin_email.strip().lower()
    admin_password = settings.admin_password

    if not admin_email or not admin_password:
        return

    if len(admin_password) < 8:
        return

    db = SessionLocal()

    try:
        existing_user = db.scalar(select(User).where(User.email == admin_email))

        if existing_user:
            existing_user.full_name = (
                settings.admin_full_name.strip() or existing_user.full_name
            )
            existing_user.hashed_password = get_password_hash(admin_password)

            if existing_user.role != UserRole.ADMIN.value:
                existing_user.role = UserRole.ADMIN.value

            db.add(existing_user)
            db.commit()
            return

        admin = User(
            email=admin_email,
            full_name=settings.admin_full_name.strip() or "Администратор",
            role=UserRole.ADMIN.value,
            hashed_password=get_password_hash(admin_password),
        )

        db.add(admin)
        db.commit()
    finally:
        db.close()


def seed_catalog_data() -> None:
    products = [
        Product(
            id="product-1",
            name="Напиток кокосовый Planto 0,9% 1 л",
            weight="1 л",
            tag="Без лактозы",
            price=179.99,
            old_price=234.33,
            expiry_days=14,
            is_verified=True,
            is_published=True,
            status="approved",
            seller_id="demo-seller",
        ),
        Product(
            id="product-2",
            name="Йогурт без сахара 0% 200 г",
            weight="200 г",
            tag="Без сахара",
            price=59.9,
            old_price=70,
            expiry_days=7,
            is_verified=True,
            is_published=True,
            status="approved",
            seller_id="demo-seller",
        ),
        Product(
            id="product-3",
            name="Молоко халяль 1 л",
            weight="1 л",
            tag="Халяль",
            price=99.5,
            old_price=110,
            expiry_days=5,
            is_verified=True,
            is_published=True,
            status="approved",
            seller_id="demo-seller",
        ),
        Product(
            id="product-4",
            name="Творог мягкий 5% 180 г",
            weight="180 г",
            tag="Белковый",
            price=84.9,
            old_price=96.5,
            expiry_days=6,
            is_verified=True,
            is_published=True,
            status="approved",
            seller_id="demo-seller",
        ),
        Product(
            id="product-5",
            name="Сыр сливочный 150 г",
            weight="150 г",
            tag="Сливочный",
            price=129.99,
            old_price=158.5,
            expiry_days=10,
            is_verified=True,
            is_published=True,
            status="approved",
            seller_id="demo-seller",
        ),
    ]
    batches = [
        ProductBatch(
            id="batch-1",
            product_id="product-1",
            seller_id="demo-seller",
            manufactured_at="2026-05-01",
            quantity=24,
            initial_quantity=24,
        ),
        ProductBatch(
            id="batch-2",
            product_id="product-2",
            seller_id="demo-seller",
            manufactured_at="2026-05-02",
            quantity=40,
            initial_quantity=40,
        ),
        ProductBatch(
            id="batch-3",
            product_id="product-3",
            seller_id="demo-seller",
            manufactured_at="2026-05-01",
            quantity=18,
            initial_quantity=18,
        ),
    ]
    db = SessionLocal()

    try:
        for product in products:
            if not db.get(Product, product.id):
                db.add(product)

        for batch in batches:
            if not db.get(ProductBatch, batch.id):
                db.add(batch)

        db.commit()
    finally:
        db.close()
