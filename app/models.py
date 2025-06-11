from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

# 创建基类
Base = declarative_base()

class AgentPrompt(Base):
    __tablename__ = "agent_prompts"
    id = Column(String, primary_key=True)
    prompt_text = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ContentBlock(Base):
    __tablename__ = "content_blocks"
    id = Column(String, primary_key=True)
    prompt_id = Column(String)
    content = Column(Text)  # 简化：存 JSON 字符串
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# 确保导出 Base
__all__ = ['Base', 'AgentPrompt', 'ContentBlock']