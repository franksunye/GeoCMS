"""
草稿管理 API - Sprint 5 规划和草稿增强
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db import get_db
from app.services.draft_service import DraftService
from app.models import Draft

router = APIRouter()

# Pydantic Models
class DraftCreate(BaseModel):
    title: str
    content: str
    template_id: Optional[int] = None
    deadline: Optional[datetime] = None

class DraftUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    kanban_status: Optional[str] = None
    deadline: Optional[datetime] = None
    change_summary: Optional[str] = None

class DraftResponse(BaseModel):
    id: int
    title: str
    content: str
    status: str
    kanban_status: str
    word_count: int
    reading_time: int
    seo_score: int
    quality_score: int
    deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DraftVersionResponse(BaseModel):
    id: int
    version_number: int
    content: str
    change_summary: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContentAnalysisResponse(BaseModel):
    word_count: int
    reading_time: int
    seo_score: int
    quality_score: int
    seo_details: Dict[str, Any]
    quality_details: Dict[str, Any]

class KanbanViewResponse(BaseModel):
    todo: List[DraftResponse]
    in_progress: List[DraftResponse]
    done: List[DraftResponse]

# Endpoints
@router.post("/drafts", response_model=DraftResponse)
def create_draft(
    draft_data: DraftCreate,
    db: Session = Depends(get_db)
):
    """创建新草稿"""
    try:
        service = DraftService(db)
        draft = service.create_draft(
            title=draft_data.title,
            content=draft_data.content,
            template_id=draft_data.template_id,
            deadline=draft_data.deadline
        )
        return draft
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建草稿失败: {str(e)}")

@router.get("/drafts/{draft_id}", response_model=DraftResponse)
def get_draft(
    draft_id: int,
    db: Session = Depends(get_db)
):
    """获取草稿"""
    service = DraftService(db)
    draft = service.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="草稿不存在")
    return draft

@router.get("/drafts", response_model=List[DraftResponse])
def list_drafts(
    status: Optional[str] = Query(None),
    kanban_status: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    """列出草稿"""
    service = DraftService(db)
    drafts = service.list_drafts(
        status=status,
        kanban_status=kanban_status,
        skip=skip,
        limit=limit
    )
    return drafts

@router.put("/drafts/{draft_id}", response_model=DraftResponse)
def update_draft(
    draft_id: int,
    draft_data: DraftUpdate,
    db: Session = Depends(get_db)
):
    """更新草稿"""
    try:
        service = DraftService(db)
        draft = service.update_draft(
            draft_id=draft_id,
            title=draft_data.title,
            content=draft_data.content,
            status=draft_data.status,
            kanban_status=draft_data.kanban_status,
            deadline=draft_data.deadline,
            change_summary=draft_data.change_summary
        )
        if not draft:
            raise HTTPException(status_code=404, detail="草稿不存在")
        return draft
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新草稿失败: {str(e)}")

@router.delete("/drafts/{draft_id}")
def delete_draft(
    draft_id: int,
    db: Session = Depends(get_db)
):
    """删除草稿"""
    service = DraftService(db)
    if not service.delete_draft(draft_id):
        raise HTTPException(status_code=404, detail="草稿不存在")
    return {"message": "草稿已删除"}

@router.get("/drafts/{draft_id}/versions", response_model=List[DraftVersionResponse])
def get_draft_versions(
    draft_id: int,
    db: Session = Depends(get_db)
):
    """获取草稿版本历史"""
    service = DraftService(db)
    versions = service.get_draft_versions(draft_id)
    return versions

@router.post("/drafts/{draft_id}/restore/{version_number}", response_model=DraftResponse)
def restore_draft_version(
    draft_id: int,
    version_number: int,
    db: Session = Depends(get_db)
):
    """恢复到指定版本"""
    try:
        service = DraftService(db)
        draft = service.restore_version(draft_id, version_number)
        if not draft:
            raise HTTPException(status_code=404, detail="草稿或版本不存在")
        return draft
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"恢复版本失败: {str(e)}")

@router.post("/drafts/{draft_id}/analyze", response_model=ContentAnalysisResponse)
def analyze_draft_content(
    draft_id: int,
    db: Session = Depends(get_db)
):
    """分析草稿内容"""
    service = DraftService(db)
    draft = service.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="草稿不存在")
    
    return {
        "word_count": draft.word_count,
        "reading_time": draft.reading_time,
        "seo_score": draft.seo_score,
        "quality_score": draft.quality_score,
        "seo_details": {
            "title_length": len(draft.title),
            "content_length": draft.word_count,
            "paragraphs": len(draft.content.split('\n\n'))
        },
        "quality_details": {
            "word_count": draft.word_count,
            "title_quality": "good" if len(draft.title) >= 10 else "fair",
            "structure_quality": "good" if len(draft.content.split('\n\n')) >= 3 else "fair"
        }
    }

@router.get("/drafts/kanban/view", response_model=KanbanViewResponse)
def get_kanban_view(db: Session = Depends(get_db)):
    """获取看板视图"""
    service = DraftService(db)
    kanban = service.get_kanban_view()
    return {
        "todo": kanban.get("todo", []),
        "in_progress": kanban.get("in_progress", []),
        "done": kanban.get("done", [])
    }

