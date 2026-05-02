from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user_role import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.BUYER


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str
    address: str
    role: UserRole
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class Token(BaseModel):
    access_token: str
    token_type: str


class UserUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(default="", max_length=64)
    address: str = Field(default="", max_length=500)
