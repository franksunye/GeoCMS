"""
知识库增强API - Sprint 2产品化功能 + Sprint 5增强
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json

from app.db import get_db
from app.models import KnowledgeBase
from app.services.knowledge_enhanced import KnowledgeEnhancedService

router = APIRouter()

# Sprint 5 新增 Pydantic Models
class CompletenessResponse(BaseModel):
    """完整度响应"""
    completeness_score: int
    filled_required_fields: int
    total_required_fields: int
    filled_optional_fields: int
    total_optional_fields: int
    missing_fields: List[str]

class MissingKnowledgeResponse(BaseModel):
    """缺失知识响应"""
    knowledge_type: str
    reason: str
    suggested_fields: List[str]

class RecommendationResponse(BaseModel):
    """推荐响应"""
    knowledge_id: int
    topic: str
    description: Optional[str]
    relevance_score: int
    reason: Optional[str]
    quality_score: int

class AddRecommendationRequest(BaseModel):
    """添加推荐请求"""
    knowledge_id: int
    task_type: str
    relevance_score: int
    reason: Optional[str] = None

# Pydantic Models
class UsageStatsResponse(BaseModel):
    """使用统计响应"""
    total_references: int
    last_used_at: Optional[str]
    recent_usage_30d: int
    usage_trend: List[Dict[str, Any]]

class QualityScoreResponse(BaseModel):
    """质量评分响应"""
    knowledge_id: int
    quality_score: int
    completeness: str
    usage_level: str
    timeliness: str

class KnowledgeEnhancedResponse(BaseModel):
    """增强的知识响应"""
    id: int
    topic: str
    content: Dict[str, Any]
    description: Optional[str]
    tags: List[str]
    reference_count: int
    last_used_at: Optional[str]
    quality_score: int
    is_archived: bool
    created_at: str
    updated_at: str
    days_since_update: int

class BatchUpdateRequest(BaseModel):
    """批量更新请求"""
    knowledge_ids: List[int]
    tags: List[str]

class BatchArchiveRequest(BaseModel):
    """批量归档请求"""
    knowledge_ids: List[int]

class ImportRequest(BaseModel):
    """导入请求"""
    data: List[Dict[str, Any]]

# Helper Functions
def _format_knowledge_enhanced(k: KnowledgeBase) -> Dict[str, Any]:
    """格式化增强的知识数据"""
    from datetime import datetime
    
    days_since_update = (datetime.now() - k.updated_at).days if k.updated_at else 0
    
    return {
        "id": k.id,
        "topic": k.topic,
        "content": json.loads(k.content),
        "description": k.description,
        "tags": json.loads(k.tags) if k.tags else [],
        "reference_count": k.reference_count or 0,
        "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        "quality_score": k.quality_score or 0,
        "is_archived": bool(k.is_archived),
        "created_at": k.created_at.isoformat(),
        "updated_at": k.updated_at.isoformat(),
        "days_since_update": days_since_update
    }

# API Endpoints
@router.get("/knowledge/enhanced", response_model=List[KnowledgeEnhancedResponse])
def list_knowledge_enhanced(
    query: Optional[str] = Query(None, description="搜索关键词"),
    tags: Optional[str] = Query(None, description="标签过滤（逗号分隔）"),
    min_quality: Optional[int] = Query(None, ge=0, le=100, description="最低质量评分"),
    include_archived: bool = Query(False, description="是否包含已归档"),
    sort_by: str = Query("updated_at", description="排序字段: updated_at, reference_count, quality_score"),
    order: str = Query("desc", description="排序方向: asc, desc"),
    db: Session = Depends(get_db)
):
    """
    获取增强的知识列表（支持搜索、过滤、排序）
    """
    try:
        service = KnowledgeEnhancedService(db)
        
        # 解析标签
        tag_list = tags.split(',') if tags else None
        
        # 搜索知识
        knowledge_list = service.search_knowledge(
            query=query,
            tags=tag_list,
            min_quality=min_quality,
            include_archived=include_archived
        )
        
        # 排序
        if sort_by == "reference_count":
            knowledge_list.sort(
                key=lambda k: k.reference_count or 0,
                reverse=(order == "desc")
            )
        elif sort_by == "quality_score":
            knowledge_list.sort(
                key=lambda k: k.quality_score or 0,
                reverse=(order == "desc")
            )
        else:  # updated_at
            knowledge_list.sort(
                key=lambda k: k.updated_at,
                reverse=(order == "desc")
            )
        
        return [_format_knowledge_enhanced(k) for k in knowledge_list]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识列表失败: {str(e)}")

@router.get("/knowledge/{knowledge_id}/stats", response_model=UsageStatsResponse)
def get_knowledge_stats(
    knowledge_id: int,
    db: Session = Depends(get_db)
):
    """
    获取知识使用统计
    """
    try:
        service = KnowledgeEnhancedService(db)
        stats = service.get_usage_stats(knowledge_id)
        
        if not stats:
            raise HTTPException(status_code=404, detail=f"知识 {knowledge_id} 不存在")
        
        return stats
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")

@router.post("/knowledge/{knowledge_id}/use")
def record_knowledge_usage(
    knowledge_id: int,
    context: Optional[str] = Query(None, description="使用场景"),
    db: Session = Depends(get_db)
):
    """
    记录知识使用
    """
    try:
        service = KnowledgeEnhancedService(db)
        service.record_usage(knowledge_id, context)
        
        return {
            "success": True,
            "message": f"已记录知识 {knowledge_id} 的使用"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"记录使用失败: {str(e)}")

@router.get("/knowledge/{knowledge_id}/quality", response_model=QualityScoreResponse)
def calculate_knowledge_quality(
    knowledge_id: int,
    db: Session = Depends(get_db)
):
    """
    计算知识质量评分
    """
    try:
        service = KnowledgeEnhancedService(db)
        score = service.calculate_quality_score(knowledge_id)
        
        # 评分等级
        if score >= 80:
            completeness = "优秀"
        elif score >= 60:
            completeness = "良好"
        elif score >= 40:
            completeness = "一般"
        else:
            completeness = "需改进"
        
        # 使用等级
        knowledge = db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_id).first()
        ref_count = knowledge.reference_count or 0 if knowledge else 0
        
        if ref_count >= 50:
            usage_level = "高频使用"
        elif ref_count >= 20:
            usage_level = "常用"
        elif ref_count >= 5:
            usage_level = "偶尔使用"
        else:
            usage_level = "很少使用"
        
        # 时效性
        from datetime import datetime
        if knowledge and knowledge.updated_at:
            days = (datetime.now() - knowledge.updated_at).days
            if days <= 30:
                timeliness = "最新"
            elif days <= 90:
                timeliness = "较新"
            elif days <= 180:
                timeliness = "需更新"
            else:
                timeliness = "过期"
        else:
            timeliness = "未知"
        
        return {
            "knowledge_id": knowledge_id,
            "quality_score": score,
            "completeness": completeness,
            "usage_level": usage_level,
            "timeliness": timeliness
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算质量评分失败: {str(e)}")

@router.get("/knowledge/top")
def get_top_knowledge(
    limit: int = Query(10, ge=1, le=50, description="返回数量"),
    db: Session = Depends(get_db)
):
    """
    获取热门知识（按引用次数排序）
    """
    try:
        service = KnowledgeEnhancedService(db)
        knowledge_list = service.get_top_knowledge(limit)
        
        return [_format_knowledge_enhanced(k) for k in knowledge_list]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取热门知识失败: {str(e)}")

@router.get("/knowledge/outdated")
def get_outdated_knowledge(
    days: int = Query(90, ge=1, le=365, description="天数阈值"),
    db: Session = Depends(get_db)
):
    """
    获取过期知识（超过指定天数未更新）
    """
    try:
        service = KnowledgeEnhancedService(db)
        knowledge_list = service.get_outdated_knowledge(days)
        
        return [_format_knowledge_enhanced(k) for k in knowledge_list]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取过期知识失败: {str(e)}")

@router.post("/knowledge/batch/tags")
def batch_update_tags(
    request: BatchUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    批量更新标签
    """
    try:
        service = KnowledgeEnhancedService(db)
        count = service.batch_update_tags(request.knowledge_ids, request.tags)
        
        return {
            "success": True,
            "updated_count": count,
            "message": f"已更新 {count} 个知识的标签"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量更新标签失败: {str(e)}")

@router.post("/knowledge/batch/archive")
def batch_archive(
    request: BatchArchiveRequest,
    db: Session = Depends(get_db)
):
    """
    批量归档
    """
    try:
        service = KnowledgeEnhancedService(db)
        count = service.batch_archive(request.knowledge_ids)
        
        return {
            "success": True,
            "archived_count": count,
            "message": f"已归档 {count} 个知识"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量归档失败: {str(e)}")

@router.get("/knowledge/export")
def export_knowledge(
    knowledge_ids: Optional[str] = Query(None, description="知识ID列表（逗号分隔），为空则导出全部"),
    db: Session = Depends(get_db)
):
    """
    导出知识（JSON格式）
    """
    try:
        service = KnowledgeEnhancedService(db)
        
        # 解析ID列表
        ids = [int(id.strip()) for id in knowledge_ids.split(',')] if knowledge_ids else None
        
        data = service.export_knowledge(ids)
        
        return {
            "success": True,
            "count": len(data),
            "data": data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出知识失败: {str(e)}")

@router.post("/knowledge/import")
def import_knowledge(
    request: ImportRequest,
    db: Session = Depends(get_db)
):
    """
    导入知识（JSON格式）
    """
    try:
        service = KnowledgeEnhancedService(db)
        result = service.import_knowledge(request.data)

        return {
            "success": True,
            **result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入知识失败: {str(e)}")

# Sprint 5 新增端点

@router.get("/knowledge/{knowledge_id}/completeness", response_model=CompletenessResponse)
def get_knowledge_completeness(
    knowledge_id: int,
    db: Session = Depends(get_db)
):
    """
    获取知识完整度评分 - Sprint 5
    """
    try:
        service = KnowledgeEnhancedService(db)
        result = service.get_knowledge_completeness(knowledge_id)

        if not result:
            raise HTTPException(status_code=404, detail="知识不存在")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取完整度失败: {str(e)}")

@router.post("/knowledge/detect-missing")
def detect_missing_knowledge(
    prompt: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    检测缺失的知识 - Sprint 5
    """
    try:
        service = KnowledgeEnhancedService(db)
        missing = service.detect_missing_knowledge(prompt)

        return {
            "success": True,
            "missing_count": len(missing),
            "missing_knowledge": missing
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检测缺失知识失败: {str(e)}")

@router.get("/knowledge/recommendations/{task_type}", response_model=List[RecommendationResponse])
def get_task_based_recommendations(
    task_type: str,
    context: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    获取基于任务的知识推荐 - Sprint 5
    """
    try:
        service = KnowledgeEnhancedService(db)
        recommendations = service.get_task_based_recommendations(task_type, context)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取推荐失败: {str(e)}")

@router.post("/knowledge/recommendations")
def add_knowledge_recommendation(
    request: AddRecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    添加知识推荐 - Sprint 5
    """
    try:
        service = KnowledgeEnhancedService(db)
        recommendation = service.add_recommendation(
            knowledge_id=request.knowledge_id,
            task_type=request.task_type,
            relevance_score=request.relevance_score,
            reason=request.reason
        )

        return {
            "success": True,
            "recommendation_id": recommendation.id,
            "message": "推荐已添加"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加推荐失败: {str(e)}")

