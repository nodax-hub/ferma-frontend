from sqlalchemy import text

from app.db.session import engine


def apply_sqlite_migrations() -> None:
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        columns = connection.execute(text("PRAGMA table_info(users)")).mappings().all()
        column_names = {column["name"] for column in columns}

        if columns and "role" not in column_names:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'buyer'")
            )

        if columns and "phone" not in column_names:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN phone VARCHAR(64) DEFAULT ''")
            )

        if columns and "address" not in column_names:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN address VARCHAR(500) DEFAULT ''")
            )
