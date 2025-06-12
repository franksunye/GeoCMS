import json
import logging
from fastapi import APIRouter, HTTPException
from app.models import AgentPrompt, ContentBlock
from app.agents.planner import plan_task
from app.agents.writer import write_content
from app.db import get_db

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/run-prompt")
def run_prompt(payload: dict):
    """处理提示词并生成内容"""
    db = None
    try:
        logger.info(f"收到提示词请求: {payload}")

        # 验证输入
        if not payload:
            raise HTTPException(status_code=400, detail="请求体不能为空")

        prompt_text = payload.get("prompt")
        if prompt_text is None:
            raise HTTPException(status_code=400, detail="提示词不能为空")

        if not isinstance(prompt_text, str):
            raise HTTPException(status_code=422, detail="提示词必须是字符串类型")

        if not prompt_text.strip():
            raise HTTPException(status_code=400, detail="提示词不能为空")

        # 获取数据库会话
        db = next(get_db())

        # 创建提示词记录
        prompt = AgentPrompt(prompt_text=prompt_text)
        db.add(prompt)
        db.commit()
        db.refresh(prompt)
        logger.info(f"保存提示词记录，ID: {prompt.id}")

        # 规划任务（包含知识分析）
        task = plan_task(prompt_text, db)
        logger.info(f"任务规划完成: {task}")

        # 检查是否缺少必要知识
        if task.get("task") == "missing_knowledge":
            logger.info("检测到缺失知识，返回缺失信息")
            return {
                "status": "missing_knowledge",
                "prompt_id": prompt.id,
                "missing_knowledge": task.get("missing_knowledge", []),
                "available_knowledge": task.get("available_knowledge", []),
                "message": "需要补充以下知识才能生成更准确的内容"
            }

        # 生成内容
        result = write_content(task)
        logger.info(f"内容生成完成，类型: {type(result)}")

        # 处理结果格式
        if isinstance(result, dict):
            # 结构化内容
            content_json = json.dumps(result, ensure_ascii=False)
            content_type = "structured"
        else:
            # 文本内容
            content_json = result
            content_type = "text"

        # 保存内容块
        content_block = ContentBlock(
            prompt_id=prompt.id,
            content=content_json,
            block_type=content_type
        )
        db.add(content_block)
        db.commit()
        logger.info(f"保存内容块，ID: {content_block.id}")

        # 返回统一格式的响应
        response = {
            "status": "success",
            "id": content_block.id,
            "prompt_id": prompt.id,
            "content": result,
            "content_type": content_type,
            "knowledge_used": task.get("metadata", {}).get("knowledge_used", []),
            "created_at": content_block.created_at.isoformat() if content_block.created_at else None
        }

        logger.info("请求处理完成")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}")
        if db is not None:
            db.rollback()
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")