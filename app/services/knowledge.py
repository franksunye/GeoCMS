"""
知识库服务模块 - 提供知识库的 CRUD 操作和查询功能
"""
import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import KnowledgeBase
from app.db import get_db

class KnowledgeService:
    """知识库服务类"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_knowledge(self, topic: str, content: Dict[str, Any], description: str = None) -> KnowledgeBase:
        """
        创建新的知识条目
        
        Args:
            topic: 知识主题
            content: 知识内容（字典格式）
            description: 知识描述
            
        Returns:
            创建的知识条目
        """
        knowledge = KnowledgeBase(
            topic=topic,
            content=json.dumps(content, ensure_ascii=False),
            description=description
        )
        self.db.add(knowledge)
        self.db.commit()
        self.db.refresh(knowledge)
        return knowledge
    
    def get_knowledge_by_topic(self, topic: str) -> Optional[KnowledgeBase]:
        """
        根据主题获取知识
        
        Args:
            topic: 知识主题
            
        Returns:
            知识条目或 None
        """
        return self.db.query(KnowledgeBase).filter(KnowledgeBase.topic == topic).first()
    
    def get_all_knowledge(self) -> List[KnowledgeBase]:
        """
        获取所有知识条目
        
        Returns:
            知识条目列表
        """
        return self.db.query(KnowledgeBase).all()
    
    def update_knowledge(self, knowledge_id: int, topic: str = None, content: Dict[str, Any] = None, description: str = None) -> Optional[KnowledgeBase]:
        """
        更新知识条目
        
        Args:
            knowledge_id: 知识ID
            topic: 新的主题（可选）
            content: 新的内容（可选）
            description: 新的描述（可选）
            
        Returns:
            更新后的知识条目或 None
        """
        knowledge = self.db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_id).first()
        if not knowledge:
            return None
        
        if topic is not None:
            knowledge.topic = topic
        if content is not None:
            knowledge.content = json.dumps(content, ensure_ascii=False)
        if description is not None:
            knowledge.description = description
        
        self.db.commit()
        self.db.refresh(knowledge)
        return knowledge
    
    def delete_knowledge(self, knowledge_id: int) -> bool:
        """
        删除知识条目
        
        Args:
            knowledge_id: 知识ID
            
        Returns:
            是否删除成功
        """
        knowledge = self.db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_id).first()
        if not knowledge:
            return False
        
        self.db.delete(knowledge)
        self.db.commit()
        return True
    
    def search_knowledge(self, keywords: List[str]) -> List[KnowledgeBase]:
        """
        根据关键词搜索知识
        
        Args:
            keywords: 关键词列表
            
        Returns:
            匹配的知识条目列表
        """
        results = []
        for keyword in keywords:
            # 在主题和内容中搜索关键词
            matches = self.db.query(KnowledgeBase).filter(
                (KnowledgeBase.topic.contains(keyword)) |
                (KnowledgeBase.content.contains(keyword)) |
                (KnowledgeBase.description.contains(keyword))
            ).all()
            results.extend(matches)
        
        # 去重
        unique_results = []
        seen_ids = set()
        for result in results:
            if result.id not in seen_ids:
                unique_results.append(result)
                seen_ids.add(result.id)
        
        return unique_results
    
    def get_knowledge_content(self, knowledge: KnowledgeBase) -> Dict[str, Any]:
        """
        获取知识的内容（解析JSON）
        
        Args:
            knowledge: 知识条目
            
        Returns:
            解析后的内容字典
        """
        try:
            return json.loads(knowledge.content)
        except Exception:
            return {"error": "Invalid JSON content"}

def get_knowledge_service(db: Session = None) -> KnowledgeService:
    """
    获取知识库服务实例
    
    Args:
        db: 数据库会话（可选）
        
    Returns:
        知识库服务实例
    """
    if db is None:
        db = next(get_db())
    return KnowledgeService(db)

# 预定义的知识类型和模板
KNOWLEDGE_TEMPLATES = {
    "company_info": {
        "name": "公司名称",
        "description": "公司简介",
        "mission": "公司使命",
        "vision": "公司愿景",
        "founded": "成立时间",
        "location": "公司地址"
    },
    "product_info": {
        "name": "产品名称",
        "description": "产品描述",
        "features": ["特性1", "特性2"],
        "benefits": ["优势1", "优势2"],
        "target_audience": "目标用户",
        "pricing": "价格信息"
    },
    "brand_info": {
        "name": "品牌名称",
        "slogan": "品牌口号",
        "values": ["价值观1", "价值观2"],
        "personality": "品牌个性",
        "tone": "品牌语调"
    },
    "service_info": {
        "name": "服务名称",
        "description": "服务描述",
        "process": ["步骤1", "步骤2"],
        "benefits": ["优势1", "优势2"],
        "pricing": "价格信息"
    }
}

def get_knowledge_template(knowledge_type: str) -> Dict[str, Any]:
    """
    获取知识模板
    
    Args:
        knowledge_type: 知识类型
        
    Returns:
        知识模板
    """
    return KNOWLEDGE_TEMPLATES.get(knowledge_type, {})

def infer_knowledge_needs(prompt_text: str) -> List[str]:
    """
    从提示词推断所需的知识类型
    
    Args:
        prompt_text: 用户提示词
        
    Returns:
        所需知识类型列表
    """
    prompt_lower = prompt_text.lower()
    needed_knowledge = []
    
    # 公司信息相关
    if any(keyword in prompt_lower for keyword in ["公司", "企业", "组织", "company", "organization"]):
        needed_knowledge.append("company_info")
    
    # 产品信息相关
    if any(keyword in prompt_lower for keyword in ["产品", "软件", "应用", "product", "software", "app"]):
        needed_knowledge.append("product_info")
    
    # 品牌信息相关
    if any(keyword in prompt_lower for keyword in ["品牌", "logo", "标识", "brand", "branding"]):
        needed_knowledge.append("brand_info")
    
    # 服务信息相关
    if any(keyword in prompt_lower for keyword in ["服务", "咨询", "支持", "service", "support", "consulting"]):
        needed_knowledge.append("service_info")
    
    return needed_knowledge
