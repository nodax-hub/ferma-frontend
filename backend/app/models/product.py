from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    tag: Mapped[str] = mapped_column(String(64), nullable=True)
    weight: Mapped[str] = mapped_column(String(64), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    old_price: Mapped[float] = mapped_column(Float, nullable=True)
    image_url: Mapped[str] = mapped_column(Text, nullable=True)
    expiry_days: Mapped[int] = mapped_column(Integer, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="pending_review")
    seller_id: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    batches = relationship(
        "ProductBatch",
        back_populates="product",
        cascade="all, delete-orphan",
    )
