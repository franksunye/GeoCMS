import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import Base, get_db

# 使用内存中的 SQLite 数据库进行测试
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建测试数据库表
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# 重写依赖
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def client():
    # 在每个测试模块开始时创建表
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    # 测试完成后删除表
    Base.metadata.drop_all(bind=engine)
