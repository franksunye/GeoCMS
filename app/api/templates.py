"""
模板管理 API - Sprint 5 模板系统
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db import get_db
from app.services.template_service import TemplateService
from app.models import Template

router = APIRouter()

# Pydantic Models
class TemplateCreate(BaseModel):
    name: str
    content_template: str
    description: Optional[str] = None
    variables: Optional[List[str]] = None
    category: Optional[str] = None

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content_template: Optional[str] = None
    description: Optional[str] = None
    variables: Optional[List[str]] = None
    category: Optional[str] = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    content_template: str
    description: Optional[str]
    variables: Optional[str]
    category: Optional[str]
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TemplatePreviewResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    variables: List[str]
    preview: str
    usage_count: int

class TemplateRenderRequest(BaseModel):
    variables: Dict[str, str]

class TemplateRenderResponse(BaseModel):
    content: str

# Endpoints
@router.post("/templates", response_model=TemplateResponse)
def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db)
):
    """创建新模板"""
    try:
        service = TemplateService(db)
        template = service.create_template(
            name=template_data.name,
            content_template=template_data.content_template,
            description=template_data.description,
            variables=template_data.variables,
            category=template_data.category
        )
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建模板失败: {str(e)}")

@router.get("/templates/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """获取模板"""
    service = TemplateService(db)
    template = service.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return template

@router.get("/templates", response_model=List[TemplateResponse])
def list_templates(
    category: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    """列出模板"""
    service = TemplateService(db)
    templates = service.list_templates(
        category=category,
        skip=skip,
        limit=limit
    )
    return templates

@router.put("/templates/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db)
):
    """更新模板"""
    try:
        service = TemplateService(db)
        template = service.update_template(
            template_id=template_id,
            name=template_data.name,
            content_template=template_data.content_template,
            description=template_data.description,
            variables=template_data.variables,
            category=template_data.category
        )
        if not template:
            raise HTTPException(status_code=404, detail="模板不存在")
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新模板失败: {str(e)}")

@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db)
):
    """删除模板"""
    service = TemplateService(db)
    if not service.delete_template(template_id):
        raise HTTPException(status_code=404, detail="模板不存在")
    return {"message": "模板已删除"}

@router.get("/templates/{template_id}/preview", response_model=TemplatePreviewResponse)
def get_template_preview(
    template_id: int,
    db: Session = Depends(get_db)
):
    """获取模板预览"""
    service = TemplateService(db)
    preview = service.get_template_preview(template_id)
    if not preview:
        raise HTTPException(status_code=404, detail="模板不存在")
    return preview

@router.post("/templates/{template_id}/render", response_model=TemplateRenderResponse)
def render_template(
    template_id: int,
    render_data: TemplateRenderRequest,
    db: Session = Depends(get_db)
):
    """渲染模板"""
    try:
        service = TemplateService(db)
        content = service.render_template(template_id, render_data.variables)
        if content is None:
            raise HTTPException(status_code=404, detail="模板不存在")
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"渲染模板失败: {str(e)}")

@router.get("/templates/popular", response_model=List[TemplateResponse])
def get_popular_templates(
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    """获取热门模板"""
    service = TemplateService(db)
    templates = service.get_popular_templates(limit)
    return templates

@router.get("/templates/search", response_model=List[TemplateResponse])
def search_templates(
    query: str = Query(...),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """搜索模板"""
    service = TemplateService(db)
    templates = service.search_templates(query, category)
    return templates

