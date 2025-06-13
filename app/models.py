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

class PlannerRuns(Base):
    __tablename__ = "planner_runs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_intent = Column(Text, nullable=False)
    state = Column(Text, nullable=False)  # JSON 格式存储状态槽位
    status = Column(String(50), default="active")  # active/completed/failed
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    tasks = relationship("PlannerTasks", back_populates="run")

class PlannerTasks(Base):
    __tablename__ = "planner_tasks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("planner_runs.id"))
    task_type = Column(String(50), nullable=False)  # ask_slot/generate_content/verify
    task_data = Column(Text, nullable=False)  # JSON 格式存储任务数据
    result = Column(Text)  # JSON 格式存储任务结果
    status = Column(String(50), default="pending")  # pending/completed/failed
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    run = relationship("PlannerRuns", back_populates="tasks")

class VerifierLogs(Base):
    __tablename__ = "verifier_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    content_block_id = Column(Integer, ForeignKey("content_blocks.id"))
    verification_result = Column(Text, nullable=False)  # JSON 格式存储校验结果
    issues_found = Column(Text)  # JSON 格式存储发现的问题
    suggestions = Column(Text)  # JSON 格式存储改进建议
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    content_block = relationship("ContentBlock")

# 确保导出 Base
__all__ = ['Base', 'AgentPrompt', 'ContentBlock', 'KnowledgeBase', 'PlannerRuns', 'PlannerTasks', 'VerifierLogs']