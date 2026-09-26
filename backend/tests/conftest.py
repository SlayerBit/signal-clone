import pytest
from app.database.session import Base, engine
from main import run_sqlite_migrations
from seed.run import seed_if_empty

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    run_sqlite_migrations(engine)
    seed_if_empty(engine)
    yield
