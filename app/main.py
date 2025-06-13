from fastapi import FastAPI
from .api.run_prompt import router as prompt_router
from .api.knowledge import router as knowledge_router
from .api.ai_native import router as ai_native_router
from .db import create_tables

app = FastAPI(title="GeoCMS PoC", description="基于 LLM 的内容生成系统 - AI Native")

# 创建数据库表
create_tables()

# 注册路由
app.include_router(prompt_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")
app.include_router(ai_native_router, prefix="/api/ai-native")