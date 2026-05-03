from pydantic import BaseModel, Field


class ProductRead(BaseModel):
    id: str
    name: str
    tag: str | None = None
    weight: str | None = None
    price: float
    oldPrice: float | None = None
    imageUrl: str | None = None
    expiryDays: int | None = None
    isVerified: bool
    isPublished: bool
    status: str
    sellerId: str
    createdAt: str
    updatedAt: str


class ProductCreate(BaseModel):
    id: str | None = None
    name: str = Field(min_length=3, max_length=120)
    tag: str | None = Field(default=None, max_length=64)
    weight: str | None = Field(default=None, max_length=64)
    price: float = Field(gt=0)
    oldPrice: float | None = Field(default=None, gt=0)
    imageUrl: str | None = None
    expiryDays: int | None = Field(default=None, gt=0)


class ProductUpdate(ProductCreate):
    id: str | None = None


class ProductStatusUpdate(BaseModel):
    status: str


class ProductBatchRead(BaseModel):
    id: str
    productId: str
    sellerId: str
    manufacturedAt: str
    quantity: int
    initialQuantity: int
    createdAt: str
    updatedAt: str


class ProductBatchCreate(BaseModel):
    id: str | None = None
    productId: str
    manufacturedAt: str = Field(min_length=1, max_length=32)
    quantity: int = Field(gt=0)


class ProductQuantityDecrease(BaseModel):
    productId: str
    quantity: int = Field(gt=0)
