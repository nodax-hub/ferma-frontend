from sqlalchemy import delete, select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.product import Product
from app.models.product_batch import ProductBatch
from app.models.user import User
from app.models.user_role import UserRole

TEST_PASSWORD = "password123"
DEMO_PRODUCT_IDS = {
    "product-1",
    "product-2",
    "product-3",
    "product-4",
    "product-5",
}

TEST_USERS = [
    {
        "email": "admin1@example.com",
        "full_name": "Администратор 1",
        "role": UserRole.ADMIN,
    },
    {
        "email": "admin2@example.com",
        "full_name": "Администратор 2",
        "role": UserRole.ADMIN,
    },
    {
        "email": "admin3@example.com",
        "full_name": "Администратор 3",
        "role": UserRole.ADMIN,
    },
    {
        "email": "admin4@example.com",
        "full_name": "Администратор 4",
        "role": UserRole.ADMIN,
    },
    {
        "email": "admin5@example.com",
        "full_name": "Администратор 5",
        "role": UserRole.ADMIN,
    },
    {
        "email": "buyer1@example.com",
        "full_name": "Покупатель 1",
        "role": UserRole.BUYER,
        "phone": "+7 900 100-00-01",
        "address": "Самара, ул. Полевая, 1",
    },
    {
        "email": "buyer2@example.com",
        "full_name": "Покупатель 2",
        "role": UserRole.BUYER,
        "phone": "+7 900 100-00-02",
        "address": "Самара, ул. Садовая, 2",
    },
    {
        "email": "seller1@example.com",
        "full_name": "Продавец 1",
        "role": UserRole.SELLER,
        "phone": "+7 900 200-00-01",
        "address": "Самарская область, ферма Северная",
    },
    {
        "email": "seller2@example.com",
        "full_name": "Продавец 2",
        "role": UserRole.SELLER,
        "phone": "+7 900 200-00-02",
        "address": "Самарская область, ферма Южная",
    },
]

SELLER_PRODUCTS = {
    "seller1@example.com": [
        {
            "id": "seller-1-product-1",
            "name": "Молоко фермерское 1 л",
            "weight": "1 л",
            "tag": "Натуральное",
            "price": 120.0,
            "old_price": 145.0,
            "expiry_days": 5,
            "manufactured_at": "2026-05-03",
            "quantity": 30,
        },
        {
            "id": "seller-1-product-2",
            "name": "Творог деревенский 5% 300 г",
            "weight": "300 г",
            "tag": "Белковый",
            "price": 165.0,
            "old_price": 190.0,
            "expiry_days": 6,
            "manufactured_at": "2026-05-03",
            "quantity": 22,
        },
        {
            "id": "seller-1-product-3",
            "name": "Сметана густая 20% 250 г",
            "weight": "250 г",
            "tag": "Домашняя",
            "price": 135.0,
            "old_price": 160.0,
            "expiry_days": 7,
            "manufactured_at": "2026-05-02",
            "quantity": 26,
        },
    ],
    "seller2@example.com": [
        {
            "id": "seller-2-product-1",
            "name": "Яйцо куриное C1 10 шт",
            "weight": "10 шт",
            "tag": "Фермерское",
            "price": 115.0,
            "old_price": 140.0,
            "expiry_days": 25,
            "manufactured_at": "2026-05-01",
            "quantity": 50,
        },
        {
            "id": "seller-2-product-2",
            "name": "Сыр полутвердый 200 г",
            "weight": "200 г",
            "tag": "Сливочный",
            "price": 260.0,
            "old_price": 310.0,
            "expiry_days": 14,
            "manufactured_at": "2026-05-02",
            "quantity": 18,
        },
        {
            "id": "seller-2-product-3",
            "name": "Мед цветочный 500 г",
            "weight": "500 г",
            "tag": "Пасека",
            "price": 420.0,
            "old_price": 490.0,
            "expiry_days": 365,
            "manufactured_at": "2026-04-28",
            "quantity": 16,
        },
    ],
}


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


def seed_test_users(db) -> dict[str, User]:
    users_by_email: dict[str, User] = {}

    for user_data in TEST_USERS:
        email = user_data["email"].strip().lower()
        user = db.scalar(select(User).where(User.email == email))

        if user is None:
            user = User(
                email=email,
                full_name=user_data["full_name"],
                role=user_data["role"].value,
                hashed_password=get_password_hash(TEST_PASSWORD),
            )

        user.full_name = user_data["full_name"]
        user.role = user_data["role"].value
        user.phone = user_data.get("phone", "")
        user.address = user_data.get("address", "")
        user.hashed_password = get_password_hash(TEST_PASSWORD)

        db.add(user)
        users_by_email[email] = user

    db.flush()

    return users_by_email


def seed_catalog_data() -> None:
    db = SessionLocal()

    try:
        users_by_email = seed_test_users(db)
        cleanup_demo_catalog_data(db)
        seed_seller_products(db, users_by_email)
        db.commit()
    finally:
        db.close()


def cleanup_demo_catalog_data(db) -> None:
    db.execute(
        delete(ProductBatch).where(
            ProductBatch.seller_id == "demo-seller",
        ),
    )
    db.execute(delete(ProductBatch).where(ProductBatch.product_id.in_(DEMO_PRODUCT_IDS)))
    db.execute(delete(Product).where(Product.seller_id == "demo-seller"))
    db.execute(delete(Product).where(Product.id.in_(DEMO_PRODUCT_IDS)))


def seed_seller_products(db, users_by_email: dict[str, User]) -> None:
    for seller_email, seller_products in SELLER_PRODUCTS.items():
        seller = users_by_email[seller_email]
        seller_id = str(seller.id)

        for product_data in seller_products:
            product = db.get(Product, product_data["id"])

            if product is None:
                product = Product(id=product_data["id"])

            product.name = product_data["name"]
            product.weight = product_data["weight"]
            product.tag = product_data["tag"]
            product.price = product_data["price"]
            product.old_price = product_data["old_price"]
            product.expiry_days = product_data["expiry_days"]
            product.is_verified = True
            product.is_published = True
            product.status = "approved"
            product.seller_id = seller_id

            db.add(product)

            batch_id = f"{product_data['id']}-batch-1"
            batch = db.get(ProductBatch, batch_id)

            if batch is None:
                batch = ProductBatch(id=batch_id)

            batch.product_id = product.id
            batch.seller_id = seller_id
            batch.manufactured_at = product_data["manufactured_at"]
            batch.quantity = product_data["quantity"]
            batch.initial_quantity = product_data["quantity"]

            db.add(batch)
