from fastapi import APIRouter, HTTPException
from app.models import AgentPrompt, ContentBlock
from app.agents.planner import plan_task
from app.agents.writer import write_content
from app.db import get_db

router = APIRouter()

@router.post("/run-prompt")
def run_prompt(payload: dict):
    """处理提示词并生成内容"""
    db = None
    try:
        # 验证输入
        if not payload:
            raise HTTPException(status_code=400, detail="请求体不能为空")
        
        prompt_text = payload.get("prompt")
        if not prompt_text:
            raise HTTPException(status_code=400, detail="提示词不能为空")
        
        if not isinstance(prompt_text, str):
            raise HTTPException(status_code=422, detail="提示词必须是字符串类型")
        
        # 获取数据库会话
        db = next(get_db())
        
        # 创建提示词记录
        prompt = AgentPrompt(prompt_text=prompt_text)
        db.add(prompt)
        db.commit()
        db.refresh(prompt)
        
        # 规划任务
        task = plan_task(prompt_text)
        
        # 生成内容
        result = write_content(task)
        
        # 保存内容块
        content_block = ContentBlock(
            prompt_id=prompt.id,
            content=result,
            block_type="text"
        )
        db.add(content_block)
        db.commit()
        
        return {"content": result}
        
    except HTTPException:
        raise
    except Exception as e:
        if db is not None:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 