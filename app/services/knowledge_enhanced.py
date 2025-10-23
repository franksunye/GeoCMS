"""
知识库增强服务 - Sprint 2产品化功能
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models import KnowledgeBase, KnowledgeUsageLog
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

class KnowledgeEnhancedService:
    """知识库增强服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def record_usage(self, knowledge_id: int, context: str = None) -> None:
        """
        记录知识使用
        
        Args:
            knowledge_id: 知识ID
            context: 使用场景
        """
        # 创建使用日志
        log = KnowledgeUsageLog(
            knowledge_id=knowledge_id,
            used_in_context=context,
            used_at=datetime.now()
        )
        self.db.add(log)
        
        # 更新知识的引用计数和最后使用时间
        knowledge = self.db.query(KnowledgeBase).filter(
            KnowledgeBase.id == knowledge_id
        ).first()
        
        if knowledge:
            knowledge.reference_count = (knowledge.reference_count or 0) + 1
            knowledge.last_used_at = datetime.now()
        
        self.db.commit()
    
    def get_usage_stats(self, knowledge_id: int) -> Dict[str, Any]:
        """
        获取知识使用统计
        
        Args:
            knowledge_id: 知识ID
            
        Returns:
            统计信息字典
        """
        knowledge = self.db.query(KnowledgeBase).filter(
            KnowledgeBase.id == knowledge_id
        ).first()
        
        if not knowledge:
            return {}
        
        # 获取最近30天的使用记录
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_usage = self.db.query(KnowledgeUsageLog).filter(
            KnowledgeUsageLog.knowledge_id == knowledge_id,
            KnowledgeUsageLog.used_at >= thirty_days_ago
        ).count()
        
        # 获取使用趋势（按天统计）
        usage_trend = self.db.query(
            func.date(KnowledgeUsageLog.used_at).label('date'),
            func.count(KnowledgeUsageLog.id).label('count')
        ).filter(
            KnowledgeUsageLog.knowledge_id == knowledge_id,
            KnowledgeUsageLog.used_at >= thirty_days_ago
        ).group_by(
            func.date(KnowledgeUsageLog.used_at)
        ).all()
        
        return {
            "total_references": knowledge.reference_count or 0,
            "last_used_at": knowledge.last_used_at.isoformat() if knowledge.last_used_at else None,
            "recent_usage_30d": recent_usage,
            "usage_trend": [
                {"date": str(date), "count": count}
                for date, count in usage_trend
            ]
        }
    
    def calculate_quality_score(self, knowledge_id: int) -> int:
        """
        计算知识质量评分 (0-100)
        
        评分标准：
        - 内容完整度：40分
        - 使用频率：30分
        - 更新及时性：30分
        
        Args:
            knowledge_id: 知识ID
            
        Returns:
            质量评分 (0-100)
        """
        knowledge = self.db.query(KnowledgeBase).filter(
            KnowledgeBase.id == knowledge_id
        ).first()
        
        if not knowledge:
            return 0
        
        score = 0
        
        # 1. 内容完整度 (40分)
        try:
            content = json.loads(knowledge.content)
            # 检查必要字段
            required_fields = ['description', 'details', 'examples']
            filled_fields = sum(1 for field in required_fields if content.get(field))
            completeness_score = (filled_fields / len(required_fields)) * 40
            score += completeness_score
        except:
            pass
        
        # 2. 使用频率 (30分)
        reference_count = knowledge.reference_count or 0
        if reference_count >= 50:
            usage_score = 30
        elif reference_count >= 20:
            usage_score = 25
        elif reference_count >= 10:
            usage_score = 20
        elif reference_count >= 5:
            usage_score = 15
        elif reference_count >= 1:
            usage_score = 10
        else:
            usage_score = 0
        score += usage_score
        
        # 3. 更新及时性 (30分)
        if knowledge.updated_at:
            days_since_update = (datetime.now() - knowledge.updated_at).days
            if days_since_update <= 30:
                timeliness_score = 30
            elif days_since_update <= 60:
                timeliness_score = 25
            elif days_since_update <= 90:
                timeliness_score = 20
            elif days_since_update <= 180:
                timeliness_score = 15
            else:
                timeliness_score = 10
            score += timeliness_score
        
        # 更新数据库中的评分
        knowledge.quality_score = int(score)
        self.db.commit()
        
        return int(score)
    
    def get_top_knowledge(self, limit: int = 10) -> List[KnowledgeBase]:
        """
        获取热门知识（按引用次数排序）
        
        Args:
            limit: 返回数量
            
        Returns:
            知识列表
        """
        return self.db.query(KnowledgeBase).filter(
            KnowledgeBase.is_archived == 0
        ).order_by(
            KnowledgeBase.reference_count.desc()
        ).limit(limit).all()
    
    def get_outdated_knowledge(self, days: int = 90) -> List[KnowledgeBase]:
        """
        获取过期知识（超过指定天数未更新）
        
        Args:
            days: 天数阈值
            
        Returns:
            知识列表
        """
        threshold_date = datetime.now() - timedelta(days=days)
        return self.db.query(KnowledgeBase).filter(
            KnowledgeBase.updated_at < threshold_date,
            KnowledgeBase.is_archived == 0
        ).all()
    
    def search_knowledge(
        self,
        query: str = None,
        tags: List[str] = None,
        min_quality: int = None,
        include_archived: bool = False
    ) -> List[KnowledgeBase]:
        """
        搜索知识
        
        Args:
            query: 搜索关键词
            tags: 标签过滤
            min_quality: 最低质量评分
            include_archived: 是否包含已归档
            
        Returns:
            知识列表
        """
        q = self.db.query(KnowledgeBase)
        
        # 归档过滤
        if not include_archived:
            q = q.filter(KnowledgeBase.is_archived == 0)
        
        # 关键词搜索
        if query:
            q = q.filter(
                or_(
                    KnowledgeBase.topic.like(f"%{query}%"),
                    KnowledgeBase.description.like(f"%{query}%"),
                    KnowledgeBase.content.like(f"%{query}%")
                )
            )
        
        # 标签过滤
        if tags:
            for tag in tags:
                q = q.filter(KnowledgeBase.tags.like(f"%{tag}%"))
        
        # 质量过滤
        if min_quality is not None:
            q = q.filter(KnowledgeBase.quality_score >= min_quality)
        
        return q.all()
    
    def batch_update_tags(self, knowledge_ids: List[int], tags: List[str]) -> int:
        """
        批量更新标签
        
        Args:
            knowledge_ids: 知识ID列表
            tags: 标签列表
            
        Returns:
            更新数量
        """
        tags_json = json.dumps(tags, ensure_ascii=False)
        count = 0
        
        for kid in knowledge_ids:
            knowledge = self.db.query(KnowledgeBase).filter(
                KnowledgeBase.id == kid
            ).first()
            if knowledge:
                knowledge.tags = tags_json
                count += 1
        
        self.db.commit()
        return count
    
    def batch_archive(self, knowledge_ids: List[int]) -> int:
        """
        批量归档
        
        Args:
            knowledge_ids: 知识ID列表
            
        Returns:
            归档数量
        """
        count = 0
        for kid in knowledge_ids:
            knowledge = self.db.query(KnowledgeBase).filter(
                KnowledgeBase.id == kid
            ).first()
            if knowledge:
                knowledge.is_archived = 1
                count += 1
        
        self.db.commit()
        return count
    
    def export_knowledge(self, knowledge_ids: List[int] = None) -> List[Dict[str, Any]]:
        """
        导出知识（JSON格式）
        
        Args:
            knowledge_ids: 知识ID列表，None表示导出全部
            
        Returns:
            知识数据列表
        """
        q = self.db.query(KnowledgeBase)
        
        if knowledge_ids:
            q = q.filter(KnowledgeBase.id.in_(knowledge_ids))
        
        knowledge_list = q.all()
        
        return [
            {
                "id": k.id,
                "topic": k.topic,
                "content": json.loads(k.content),
                "description": k.description,
                "tags": json.loads(k.tags) if k.tags else [],
                "reference_count": k.reference_count or 0,
                "quality_score": k.quality_score or 0,
                "created_at": k.created_at.isoformat(),
                "updated_at": k.updated_at.isoformat()
            }
            for k in knowledge_list
        ]
    
    def import_knowledge(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        导入知识（JSON格式）
        
        Args:
            data: 知识数据列表
            
        Returns:
            导入结果
        """
        imported = 0
        skipped = 0
        errors = []
        
        for item in data:
            try:
                # 检查是否已存在
                existing = self.db.query(KnowledgeBase).filter(
                    KnowledgeBase.topic == item['topic']
                ).first()
                
                if existing:
                    skipped += 1
                    continue
                
                # 创建新知识
                knowledge = KnowledgeBase(
                    topic=item['topic'],
                    content=json.dumps(item['content'], ensure_ascii=False),
                    description=item.get('description'),
                    tags=json.dumps(item.get('tags', []), ensure_ascii=False) if item.get('tags') else None
                )
                self.db.add(knowledge)
                imported += 1
            except Exception as e:
                errors.append(f"导入 '{item.get('topic', 'unknown')}' 失败: {str(e)}")
        
        self.db.commit()
        
        return {
            "imported": imported,
            "skipped": skipped,
            "errors": errors
        }

