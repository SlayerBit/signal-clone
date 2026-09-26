import os
import sqlite3
import tempfile
import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.models.entities import User
from main import run_sqlite_migrations


def test_sqlite_migration_adds_avatar_id_and_preserves_data():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    try:
        # Create legacy users table without avatar_id
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                username VARCHAR(64) UNIQUE,
                phone VARCHAR(32) UNIQUE,
                display_name VARCHAR(128) NOT NULL,
                avatar_color VARCHAR(16) NOT NULL,
                password_hash VARCHAR(255),
                bio VARCHAR(280),
                is_online BOOLEAN,
                last_seen_at DATETIME,
                created_at DATETIME
            )
        """)
        conn.execute(
            "INSERT INTO users (id, username, display_name, avatar_color) VALUES (1, 'alice', 'Alice Smith', '#2c6bed')"
        )
        conn.commit()
        conn.close()

        engine = create_engine(f"sqlite:///{db_path}")

        # Verify avatar_id is absent before migration
        inspector_before = inspect(engine)
        cols_before = [c["name"] for c in inspector_before.get_columns("users")]
        assert "avatar_id" not in cols_before

        # Querying User model before migration fails with OperationalError
        Session = sessionmaker(bind=engine)
        db = Session()
        with pytest.raises(Exception) as exc_info:
            db.query(User).filter_by(id=1).first()
        assert "no such column: users.avatar_id" in str(exc_info.value)
        db.close()

        # Run migration
        run_sqlite_migrations(db_engine=engine)

        # Verify avatar_id column exists
        inspector_after = inspect(engine)
        cols_after = [c["name"] for c in inspector_after.get_columns("users")]
        assert "avatar_id" in cols_after

        # Verify existing user data is preserved and can now be queried via ORM
        db = Session()
        alice = db.query(User).filter_by(id=1).first()
        assert alice is not None
        assert alice.username == "alice"
        assert alice.display_name == "Alice Smith"
        assert alice.avatar_color == "#2c6bed"
        assert alice.avatar_id is None

        # Verify we can update avatar_id
        alice.avatar_id = "shield"
        db.commit()
        db.refresh(alice)
        assert alice.avatar_id == "shield"
        db.close()

        # Test idempotency: running migration again does not error and does not corrupt data
        run_sqlite_migrations(db_engine=engine)
        run_sqlite_migrations(db_engine=engine)

        db2 = Session()
        alice2 = db2.query(User).filter_by(id=1).first()
        assert alice2.avatar_id == "shield"
        db2.close()

    finally:
        if os.path.exists(db_path):
            os.remove(db_path)


def test_sqlite_migration_ignores_non_sqlite():
    class DummyDialect:
        name = "postgresql"

    class DummyEngine:
        dialect = DummyDialect()

    # Should safely return without exception
    run_sqlite_migrations(db_engine=DummyEngine())


def test_lifespan_migrates_legacy_sqlite_db(monkeypatch):
    from fastapi.testclient import TestClient
    from main import app
    import app.database.session as session_module

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    try:
        # Create legacy users table
        conn = sqlite3.connect(db_path)
        conn.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY,
                username VARCHAR(64) UNIQUE,
                phone VARCHAR(32) UNIQUE,
                display_name VARCHAR(128) NOT NULL,
                avatar_color VARCHAR(16) NOT NULL,
                password_hash VARCHAR(255),
                bio VARCHAR(280),
                is_online BOOLEAN,
                last_seen_at DATETIME,
                created_at DATETIME
            )
        """)
        conn.execute(
            "INSERT INTO users (id, username, display_name, avatar_color) VALUES (1, 'bob', 'Bob', '#2c6bed')"
        )
        conn.commit()
        conn.close()

        test_engine = create_engine(f"sqlite:///{db_path}")
        monkeypatch.setattr(session_module, "engine", test_engine)
        import main
        monkeypatch.setattr(main, "engine", test_engine)

        with TestClient(app) as test_client:
            resp = test_client.get("/health")
            assert resp.status_code == 200

        # After client enters context, lifespan has run and migrated
        inspector = inspect(test_engine)
        cols = [c["name"] for c in inspector.get_columns("users")]
        assert "avatar_id" in cols
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

