from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, catalog, health, orders
from app.core.config import settings
from app.db.base import Base
from app.db.migrations import apply_sqlite_migrations
from app.db.seed import seed_admin_user, seed_catalog_data
from app.db.session import engine
from app.models import order as order_model  # noqa: F401
from app.models import product as product_model  # noqa: F401
from app.models import product_batch as product_batch_model  # noqa: F401
from app.models import user as user_model  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(title=settings.project_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        apply_sqlite_migrations()
        seed_admin_user()
        seed_catalog_data()

    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(catalog.router, tags=["catalog"])
    app.include_router(orders.router, tags=["orders"])

    return app


app = create_app()
