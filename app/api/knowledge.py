"""
知识库管理 API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import json

from app.db import get_db
from app.services.knowledge import KnowledgeService, get_knowledge_template, KNOWLEDGE_TEMPLATES

router = APIRouter()

# Pydantic 模型
class KnowledgeCreate(BaseModel):
    topic: str
    content: Dict[str, Any]
    description: str = None

class KnowledgeUpdate(BaseModel):
    topic: str = None
    content: Dict[str, Any] = None
    description: str = None

class KnowledgeResponse(BaseModel):
    id: int
    topic: str
    content: Dict[str, Any]
    description: str = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.post("/knowledge", response_model=KnowledgeResponse)
def create_knowledge(
    knowledge_data: KnowledgeCreate,
    db: Session = Depends(get_db)
):
    """
    创建新的知识条目
    """
    try:
        service = KnowledgeService(db)
        knowledge = service.create_knowledge(
            topic=knowledge_data.topic,
            content=knowledge_data.content,
            description=knowledge_data.description
        )
        
        return KnowledgeResponse(
            id=knowledge.id,
            topic=knowledge.topic,
            content=json.loads(knowledge.content),
            description=knowledge.description,
            created_at=knowledge.created_at.isoformat(),
            updated_at=knowledge.updated_at.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建知识失败: {str(e)}")

@router.get("/knowledge", response_model=List[KnowledgeResponse])
def list_knowledge(db: Session = Depends(get_db)):
    """
    获取所有知识条目
    """
    try:
        service = KnowledgeService(db)
        knowledge_list = service.get_all_knowledge()
        
        return [
            KnowledgeResponse(
                id=k.id,
                topic=k.topic,
                content=json.loads(k.content),
                description=k.description,
                created_at=k.created_at.isoformat(),
                updated_at=k.updated_at.isoformat()
            )
            for k in knowledge_list
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识列表失败: {str(e)}")

@router.get("/knowledge/{topic}", response_model=KnowledgeResponse)
def get_knowledge_by_topic(topic: str, db: Session = Depends(get_db)):
    """
    根据主题获取知识
    """
    try:
        service = KnowledgeService(db)
        knowledge = service.get_knowledge_by_topic(topic)
        
        if not knowledge:
            raise HTTPException(status_code=404, detail=f"未找到主题为 '{topic}' 的知识")
        
        return KnowledgeResponse(
            id=knowledge.id,
            topic=knowledge.topic,
            content=json.loads(knowledge.content),
            description=knowledge.description,
            created_at=knowledge.created_at.isoformat(),
            updated_at=knowledge.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取知识失败: {str(e)}")

@router.put("/knowledge/{knowledge_id}", response_model=KnowledgeResponse)
def update_knowledge(
    knowledge_id: int,
    knowledge_data: KnowledgeUpdate,
    db: Session = Depends(get_db)
):
    """
    更新知识条目
    """
    try:
        service = KnowledgeService(db)
        knowledge = service.update_knowledge(
            knowledge_id=knowledge_id,
            topic=knowledge_data.topic,
            content=knowledge_data.content,
            description=knowledge_data.description
        )
        
        if not knowledge:
            raise HTTPException(status_code=404, detail=f"未找到 ID 为 {knowledge_id} 的知识")
        
        return KnowledgeResponse(
            id=knowledge.id,
            topic=knowledge.topic,
            content=json.loads(knowledge.content),
            description=knowledge.description,
            created_at=knowledge.created_at.isoformat(),
            updated_at=knowledge.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新知识失败: {str(e)}")

@router.delete("/knowledge/{knowledge_id}")
def delete_knowledge(knowledge_id: int, db: Session = Depends(get_db)):
    """
    删除知识条目
    """
    try:
        service = KnowledgeService(db)
        success = service.delete_knowledge(knowledge_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"未找到 ID 为 {knowledge_id} 的知识")
        
        return {"message": "知识删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除知识失败: {str(e)}")

@router.get("/knowledge/templates/list")
def list_knowledge_templates():
    """
    获取所有知识模板
    """
    return {
        "templates": list(KNOWLEDGE_TEMPLATES.keys()),
        "details": KNOWLEDGE_TEMPLATES
    }

@router.get("/knowledge/templates/{template_type}")
def get_knowledge_template_by_type(template_type: str):
    """
    根据类型获取知识模板
    """
    template = get_knowledge_template(template_type)
    if not template:
        raise HTTPException(status_code=404, detail=f"未找到类型为 '{template_type}' 的模板")
    
    return {
        "type": template_type,
        "template": template
    }

@router.post("/knowledge/search")
def search_knowledge(
    keywords: List[str],
    db: Session = Depends(get_db)
):
    """
    根据关键词搜索知识
    """
    try:
        service = KnowledgeService(db)
        results = service.search_knowledge(keywords)
        
        return [
            KnowledgeResponse(
                id=k.id,
                topic=k.topic,
                content=json.loads(k.content),
                description=k.description,
                created_at=k.created_at.isoformat(),
                updated_at=k.updated_at.isoformat()
            )
            for k in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索知识失败: {str(e)}")

@router.post("/knowledge/batch")
def create_batch_knowledge(
    knowledge_list: List[KnowledgeCreate],
    db: Session = Depends(get_db)
):
    """
    批量创建知识条目
    """
    try:
        service = KnowledgeService(db)
        created_knowledge = []
        
        for knowledge_data in knowledge_list:
            knowledge = service.create_knowledge(
                topic=knowledge_data.topic,
                content=knowledge_data.content,
                description=knowledge_data.description
            )
            created_knowledge.append(
                KnowledgeResponse(
                    id=knowledge.id,
                    topic=knowledge.topic,
                    content=json.loads(knowledge.content),
                    description=knowledge.description,
                    created_at=knowledge.created_at.isoformat(),
                    updated_at=knowledge.updated_at.isoformat()
                )
            )
        
        return {
            "message": f"成功创建 {len(created_knowledge)} 个知识条目",
            "knowledge": created_knowledge
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量创建知识失败: {str(e)}")

@router.get("/knowledge/stats/summary")
def get_knowledge_stats(db: Session = Depends(get_db)):
    """
    获取知识库统计信息
    """
    try:
        service = KnowledgeService(db)
        all_knowledge = service.get_all_knowledge()
        
        # 统计各类型知识数量
        topic_counts = {}
        for k in all_knowledge:
            topic_counts[k.topic] = topic_counts.get(k.topic, 0) + 1
        
        return {
            "total_knowledge": len(all_knowledge),
            "topic_counts": topic_counts,
            "available_templates": list(KNOWLEDGE_TEMPLATES.keys())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")
