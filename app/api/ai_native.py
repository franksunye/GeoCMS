"""
AI Native API端点
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.db import get_db
from app.services.agent_coordinator import get_agent_coordinator, get_workflow_engine

router = APIRouter()

# Pydantic 模型
class ConversationStart(BaseModel):
    user_intent: str

class UserInput(BaseModel):
    user_input: str
    context: Optional[Dict[str, Any]] = None

class ContentGenerationRequest(BaseModel):
    task_data: Dict[str, Any]

class WorkflowRequest(BaseModel):
    workflow_type: str = "standard"

class ConversationResponse(BaseModel):
    status: str
    run_id: Optional[int] = None
    next_action: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ActionResponse(BaseModel):
    action: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/conversations", response_model=ConversationResponse)
def start_conversation(
    request: ConversationStart,
    db: Session = Depends(get_db)
):
    """
    开始新的AI Native对话
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.start_conversation(request.user_intent)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return ConversationResponse(
            status=result["status"],
            run_id=result["run_id"],
            next_action=result["next_action"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start conversation: {str(e)}")

@router.post("/conversations/{run_id}/input", response_model=ActionResponse)
def process_user_input(
    run_id: int,
    request: UserInput,
    db: Session = Depends(get_db)
):
    """
    处理用户输入
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.process_user_input(run_id, request.user_input, request.context)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return ActionResponse(
            action=result.get("action", "processed"),
            data=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process input: {str(e)}")

@router.get("/conversations/{run_id}/status")
def get_conversation_status(
    run_id: int,
    db: Session = Depends(get_db)
):
    """
    获取对话状态
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.get_conversation_status(run_id)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.post("/conversations/{run_id}/generate", response_model=ActionResponse)
def generate_content(
    run_id: int,
    request: ContentGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    生成内容
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.execute_content_generation(run_id, request.task_data)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return ActionResponse(
            action="content_generated",
            data=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

@router.post("/conversations/{run_id}/verify/{content_block_id}", response_model=ActionResponse)
def verify_content(
    run_id: int,
    content_block_id: int,
    db: Session = Depends(get_db)
):
    """
    校验内容
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.execute_content_verification(content_block_id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return ActionResponse(
            action="content_verified",
            data=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content verification failed: {str(e)}")

@router.post("/conversations/{run_id}/workflow", response_model=ActionResponse)
def execute_workflow(
    run_id: int,
    request: WorkflowRequest,
    db: Session = Depends(get_db)
):
    """
    执行工作流
    """
    try:
        workflow_engine = get_workflow_engine(db)
        result = workflow_engine.execute_workflow(run_id, request.workflow_type)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return ActionResponse(
            action="workflow_executed",
            data=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.post("/conversations/{run_id}/complete", response_model=ActionResponse)
def complete_conversation(
    run_id: int,
    db: Session = Depends(get_db)
):
    """
    完成对话
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.complete_conversation(run_id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return ActionResponse(
            action="conversation_completed",
            data=result
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete conversation: {str(e)}")

@router.get("/conversations/{run_id}/next-action")
def get_next_action(
    run_id: int,
    db: Session = Depends(get_db)
):
    """
    获取下一步行动（兼容性端点）
    """
    try:
        coordinator = get_agent_coordinator(db)
        result = coordinator.process_user_input(run_id, "", {})
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get next action: {str(e)}")

# 健康检查端点
@router.get("/health")
def health_check():
    """
    AI Native API健康检查
    """
    return {
        "status": "healthy",
        "service": "ai_native_api",
        "version": "1.0.0"
    }

@router.post("/reload-config")
def reload_config():
    """
    重新加载配置（清除缓存）
    """
    try:
        from app.services.prompt_manager import get_prompt_manager
        prompt_manager = get_prompt_manager()
        prompt_manager.reload_prompts()

        return {
            "status": "success",
            "message": "Configuration reloaded successfully"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to reload configuration: {str(e)}"
        }
