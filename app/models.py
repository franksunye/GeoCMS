from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship, declarative_base
import datetime

# 创建基类
Base = declarative_base()

class AgentPrompt(Base):
    __tablename__ = "agent_prompts"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prompt_text = Column(Text, nullable=False)
    content_blocks = relationship("ContentBlock", back_populates="prompt")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class ContentBlock(Base):
    __tablename__ = "content_blocks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prompt_id = Column(Integer, ForeignKey("agent_prompts.id"))
    content = Column(Text, nullable=False)
    block_type = Column(String(50), nullable=False, default="text")
    prompt = relationship("AgentPrompt", back_populates="content_blocks")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topic = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)  # JSON 格式存储
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

# 确保导出 Base
__all__ = ['Base', 'AgentPrompt', 'ContentBlock', 'KnowledgeBase']