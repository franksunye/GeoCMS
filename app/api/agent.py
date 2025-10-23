"""
Agent API - 提供Agent工作状态和任务信息的API端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from app.db import get_db
from app.models import PlannerRuns, PlannerTasks
from app.services.state_manager import get_state_manager, get_task_manager

router = APIRouter()

# Response Models
class TaskResponse(BaseModel):
    """任务响应模型"""
    id: int
    run_id: int
    task_type: str
    task_data: dict
    result: Optional[dict] = None
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class RunResponse(BaseModel):
    """运行响应模型"""
    id: int
    user_intent: str
    state: dict
    status: str
    progress: float
    created_at: str
    updated_at: str
    tasks: Optional[List[TaskResponse]] = None

    class Config:
        from_attributes = True

class RunListResponse(BaseModel):
    """运行列表响应模型"""
    total: int
    active_count: int
    completed_count: int
    failed_count: int
    runs: List[RunResponse]

# Helper Functions
def _format_run(run: PlannerRuns, db: Session, include_tasks: bool = False) -> dict:
    """格式化运行数据"""
    state_manager = get_state_manager(db)
    progress = state_manager.get_progress(run.id)
    
    run_data = {
        "id": run.id,
        "user_intent": run.user_intent,
        "state": json.loads(run.state),
        "status": run.status,
        "progress": progress,
        "created_at": run.created_at.isoformat(),
        "updated_at": run.updated_at.isoformat(),
    }
    
    if include_tasks:
        task_manager = get_task_manager(db)
        tasks = task_manager.get_tasks_by_run(run.id)
        run_data["tasks"] = [_format_task(task) for task in tasks]
    
    return run_data

def _format_task(task: PlannerTasks) -> dict:
    """格式化任务数据"""
    return {
        "id": task.id,
        "run_id": task.run_id,
        "task_type": task.task_type,
        "task_data": json.loads(task.task_data),
        "result": json.loads(task.result) if task.result else None,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }

# API Endpoints
@router.get("/runs", response_model=RunListResponse)
def list_runs(
    status: Optional[str] = Query(None, description="过滤状态: active, completed, failed"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    db: Session = Depends(get_db)
):
    """
    获取所有运行列表
    
    - **status**: 可选，过滤特定状态的运行
    - **limit**: 返回数量限制（默认50，最大100）
    - **offset**: 偏移量（用于分页）
    """
    try:
        query = db.query(PlannerRuns)
        
        # 状态过滤
        if status:
            query = query.filter(PlannerRuns.status == status)
        
        # 统计
        total = query.count()
        active_count = db.query(PlannerRuns).filter(PlannerRuns.status == "active").count()
        completed_count = db.query(PlannerRuns).filter(PlannerRuns.status == "completed").count()
        failed_count = db.query(PlannerRuns).filter(PlannerRuns.status == "failed").count()
        
        # 分页和排序（最新的在前）
        runs = query.order_by(PlannerRuns.created_at.desc()).offset(offset).limit(limit).all()
        
        return {
            "total": total,
            "active_count": active_count,
            "completed_count": completed_count,
            "failed_count": failed_count,
            "runs": [_format_run(run, db, include_tasks=False) for run in runs]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取运行列表失败: {str(e)}")

@router.get("/runs/{run_id}", response_model=RunResponse)
def get_run(
    run_id: int,
    include_tasks: bool = Query(True, description="是否包含任务列表"),
    db: Session = Depends(get_db)
):
    """
    获取单个运行的详细信息
    
    - **run_id**: 运行ID
    - **include_tasks**: 是否包含任务列表（默认true）
    """
    try:
        run = db.query(PlannerRuns).filter(PlannerRuns.id == run_id).first()
        
        if not run:
            raise HTTPException(status_code=404, detail=f"运行 {run_id} 不存在")
        
        return _format_run(run, db, include_tasks=include_tasks)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取运行详情失败: {str(e)}")

@router.get("/runs/{run_id}/tasks", response_model=List[TaskResponse])
def get_run_tasks(
    run_id: int,
    db: Session = Depends(get_db)
):
    """
    获取运行的所有任务
    
    - **run_id**: 运行ID
    """
    try:
        # 检查运行是否存在
        run = db.query(PlannerRuns).filter(PlannerRuns.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"运行 {run_id} 不存在")
        
        # 获取任务
        task_manager = get_task_manager(db)
        tasks = task_manager.get_tasks_by_run(run_id)
        
        return [_format_task(task) for task in tasks]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    获取单个任务的详细信息
    
    - **task_id**: 任务ID
    """
    try:
        task = db.query(PlannerTasks).filter(PlannerTasks.id == task_id).first()
        
        if not task:
            raise HTTPException(status_code=404, detail=f"任务 {task_id} 不存在")
        
        return _format_task(task)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务详情失败: {str(e)}")

@router.patch("/runs/{run_id}")
def update_run_status(
    run_id: int,
    status: str = Query(..., description="新状态: active, completed, failed"),
    db: Session = Depends(get_db)
):
    """
    更新运行状态（例如取消运行）
    
    - **run_id**: 运行ID
    - **status**: 新状态
    """
    try:
        # 验证状态
        valid_statuses = ["active", "completed", "failed"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"无效的状态: {status}。有效值: {', '.join(valid_statuses)}"
            )
        
        # 获取运行
        run = db.query(PlannerRuns).filter(PlannerRuns.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"运行 {run_id} 不存在")
        
        # 更新状态
        run.status = status
        run.updated_at = datetime.now()
        db.commit()
        db.refresh(run)
        
        return {
            "success": True,
            "run_id": run_id,
            "status": status,
            "message": f"运行状态已更新为 {status}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新运行状态失败: {str(e)}")

@router.get("/stats")
def get_agent_stats(db: Session = Depends(get_db)):
    """
    获取Agent工作统计信息
    """
    try:
        total_runs = db.query(PlannerRuns).count()
        active_runs = db.query(PlannerRuns).filter(PlannerRuns.status == "active").count()
        completed_runs = db.query(PlannerRuns).filter(PlannerRuns.status == "completed").count()
        failed_runs = db.query(PlannerRuns).filter(PlannerRuns.status == "failed").count()
        
        total_tasks = db.query(PlannerTasks).count()
        pending_tasks = db.query(PlannerTasks).filter(PlannerTasks.status == "pending").count()
        completed_tasks = db.query(PlannerTasks).filter(PlannerTasks.status == "completed").count()
        failed_tasks = db.query(PlannerTasks).filter(PlannerTasks.status == "failed").count()
        
        return {
            "runs": {
                "total": total_runs,
                "active": active_runs,
                "completed": completed_runs,
                "failed": failed_runs
            },
            "tasks": {
                "total": total_tasks,
                "pending": pending_tasks,
                "completed": completed_tasks,
                "failed": failed_tasks
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

