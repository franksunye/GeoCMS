"""
知识库增强服务 - Sprint 2产品化功能 + Sprint 5增强
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models import KnowledgeBase, KnowledgeUsageLog, KnowledgeRecommendation
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import re

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

    def get_knowledge_completeness(self, knowledge_id: int) -> Dict[str, Any]:
        """
        获取知识完整度评分 - Sprint 5

        Args:
            knowledge_id: 知识ID

        Returns:
            完整度信息
        """
        knowledge = self.db.query(KnowledgeBase).filter(
            KnowledgeBase.id == knowledge_id
        ).first()

        if not knowledge:
            return {}

        try:
            content = json.loads(knowledge.content)
        except:
            return {"completeness_score": 0, "missing_fields": []}

        # 定义必要字段
        required_fields = ['description', 'details', 'examples']
        optional_fields = ['tags', 'references', 'related_topics']

        # 计算完整度
        filled_required = sum(1 for field in required_fields if content.get(field))
        filled_optional = sum(1 for field in optional_fields if content.get(field))

        completeness_score = (filled_required / len(required_fields)) * 70 + (filled_optional / len(optional_fields)) * 30

        missing_fields = [field for field in required_fields if not content.get(field)]

        return {
            "completeness_score": int(completeness_score),
            "filled_required_fields": filled_required,
            "total_required_fields": len(required_fields),
            "filled_optional_fields": filled_optional,
            "total_optional_fields": len(optional_fields),
            "missing_fields": missing_fields
        }

    def detect_missing_knowledge(self, prompt: str) -> List[Dict[str, Any]]:
        """
        检测缺失的知识 - Sprint 5

        Args:
            prompt: 用户提示词

        Returns:
            缺失知识列表
        """
        # 关键词映射
        keyword_mapping = {
            "company_info": ["公司", "企业", "我们", "组织", "团队"],
            "product_info": ["产品", "服务", "功能", "特性", "解决方案"],
            "brand_info": ["品牌", "形象", "价值观", "使命", "愿景"],
            "service_info": ["服务", "支持", "帮助", "咨询", "培训"]
        }

        missing = []
        prompt_lower = prompt.lower()

        for knowledge_type, keywords in keyword_mapping.items():
            if any(keyword in prompt_lower for keyword in keywords):
                # 检查是否存在该类型的知识
                existing = self.db.query(KnowledgeBase).filter(
                    KnowledgeBase.topic == knowledge_type,
                    KnowledgeBase.is_archived == 0
                ).first()

                if not existing:
                    missing.append({
                        "knowledge_type": knowledge_type,
                        "reason": f"检测到需要 {knowledge_type} 但未找到相关知识",
                        "suggested_fields": self._get_suggested_fields(knowledge_type)
                    })

        return missing

    def get_task_based_recommendations(
        self,
        task_type: str,
        context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        获取基于任务的知识推荐 - Sprint 5

        Args:
            task_type: 任务类型
            context: 任务上下文

        Returns:
            推荐知识列表
        """
        # 查询推荐记录
        recommendations = self.db.query(KnowledgeRecommendation).filter(
            KnowledgeRecommendation.task_type == task_type
        ).order_by(
            KnowledgeRecommendation.relevance_score.desc()
        ).all()

        result = []
        for rec in recommendations:
            knowledge = rec.knowledge
            if knowledge and knowledge.is_archived == 0:
                result.append({
                    "knowledge_id": knowledge.id,
                    "topic": knowledge.topic,
                    "description": knowledge.description,
                    "relevance_score": rec.relevance_score,
                    "reason": rec.recommendation_reason,
                    "quality_score": knowledge.quality_score or 0
                })

        return result

    def add_recommendation(
        self,
        knowledge_id: int,
        task_type: str,
        relevance_score: int,
        reason: Optional[str] = None
    ) -> KnowledgeRecommendation:
        """
        添加知识推荐 - Sprint 5

        Args:
            knowledge_id: 知识ID
            task_type: 任务类型
            relevance_score: 相关性评分 (0-100)
            reason: 推荐原因

        Returns:
            推荐记录
        """
        # 检查是否已存在
        existing = self.db.query(KnowledgeRecommendation).filter(
            KnowledgeRecommendation.knowledge_id == knowledge_id,
            KnowledgeRecommendation.task_type == task_type
        ).first()

        if existing:
            existing.relevance_score = relevance_score
            existing.recommendation_reason = reason
            self.db.commit()
            return existing

        recommendation = KnowledgeRecommendation(
            knowledge_id=knowledge_id,
            task_type=task_type,
            relevance_score=relevance_score,
            recommendation_reason=reason
        )
        self.db.add(recommendation)
        self.db.commit()
        self.db.refresh(recommendation)
        return recommendation

    def _get_suggested_fields(self, knowledge_type: str) -> List[str]:
        """获取建议字段"""
        field_mapping = {
            "company_info": ["name", "description", "mission", "vision", "team_size"],
            "product_info": ["name", "description", "features", "pricing", "target_market"],
            "brand_info": ["brand_name", "tagline", "values", "brand_story", "visual_identity"],
            "service_info": ["service_name", "description", "benefits", "pricing", "support"]
        }
        return field_mapping.get(knowledge_type, [])

