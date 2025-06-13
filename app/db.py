from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base
from typing import Generator

# 数据库连接配置
engine = create_engine("sqlite:///./test_ai_native.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """
    创建所有数据库表
    """
    Base.metadata.create_all(bind=engine)

# 创建所有表（如果不存在）
create_tables()

def get_db() -> Generator[Session, None, None]:
    """
    获取数据库会话的依赖函数

    Yields:
        Session: SQLAlchemy 数据库会话
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()