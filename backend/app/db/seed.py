from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
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
