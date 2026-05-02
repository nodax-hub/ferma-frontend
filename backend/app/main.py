from fastapi import FastAPI

from app.api.routes import auth, health
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import user as user_model  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(title=settings.project_name)

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)

    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/auth", tags=["auth"])

    return app


app = create_app()
