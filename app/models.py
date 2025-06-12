from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

# 创建基类
Base = declarative_base()

class AgentPrompt(Base):
    __tablename__ = "agent_prompts"
    id = Column(Integer, primary_key=True, index=True)
    prompt_text = Column(Text, nullable=False)
    content_blocks = relationship("ContentBlock", back_populates="prompt")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ContentBlock(Base):
    __tablename__ = "content_blocks"
    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("agent_prompts.id"))
    content = Column(Text, nullable=False)
    block_type = Column(String(50), nullable=False, default="text")
    prompt = relationship("AgentPrompt", back_populates="content_blocks")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# 确保导出 Base
__all__ = ['Base', 'AgentPrompt', 'ContentBlock']