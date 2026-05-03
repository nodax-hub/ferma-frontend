from pydantic import BaseModel, Field

from app.schemas.catalog import ProductRead


class CustomerInfo(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=64)
    address: str = Field(min_length=1, max_length=500)
    comment: str = ""


class OrderItemCreate(BaseModel):
    product: ProductRead
    quantity: int = Field(gt=0)


class OrderItemRead(BaseModel):
    product: ProductRead
    quantity: int


class OrderCreate(BaseModel):
    id: str | None = None
    customer: CustomerInfo
    items: list[OrderItemCreate] = Field(min_length=1)
    status: str = "created"


class OrderRead(BaseModel):
    id: str
    createdAt: str
    customer: CustomerInfo
    items: list[OrderItemRead]
    totalPrice: float
    totalQuantity: int
    status: str
