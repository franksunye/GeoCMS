"""
草稿管理服务 - Sprint 5 规划和草稿增强
"""
from sqlalchemy.orm import Session
from app.models import Draft, DraftVersion, Template
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import re

class DraftService:
    """草稿管理服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_draft(
        self,
        title: str,
        content: str,
        template_id: Optional[int] = None,
        deadline: Optional[datetime] = None
    ) -> Draft:
        """
        创建新草稿
        
        Args:
            title: 草稿标题
            content: 草稿内容
            template_id: 模板ID
            deadline: 截止日期
            
        Returns:
            创建的草稿
        """
        draft = Draft(
            title=title,
            content=content,
            template_id=template_id,
            deadline=deadline,
            status="draft",
            kanban_status="todo"
        )
        self._analyze_content(draft)
        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)
        return draft
    
    def update_draft(
        self,
        draft_id: int,
        title: Optional[str] = None,
        content: Optional[str] = None,
        status: Optional[str] = None,
        kanban_status: Optional[str] = None,
        deadline: Optional[datetime] = None,
        change_summary: Optional[str] = None
    ) -> Optional[Draft]:
        """
        更新草稿
        
        Args:
            draft_id: 草稿ID
            title: 新标题
            content: 新内容
            status: 新状态
            kanban_status: 新看板状态
            deadline: 新截止日期
            change_summary: 变更摘要
            
        Returns:
            更新后的草稿
        """
        draft = self.db.query(Draft).filter(Draft.id == draft_id).first()
        if not draft:
            return None
        
        # 如果内容有变化，创建版本记录
        if content and content != draft.content:
            self._create_version(draft, change_summary)
        
        # 更新字段
        if title:
            draft.title = title
        if content:
            draft.content = content
            self._analyze_content(draft)
        if status:
            draft.status = status
        if kanban_status:
            draft.kanban_status = kanban_status
        if deadline:
            draft.deadline = deadline
        
        draft.updated_at = datetime.now()
        self.db.commit()
        self.db.refresh(draft)
        return draft
    
    def get_draft(self, draft_id: int) -> Optional[Draft]:
        """获取草稿"""
        return self.db.query(Draft).filter(Draft.id == draft_id).first()
    
    def list_drafts(
        self,
        status: Optional[str] = None,
        kanban_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Draft]:
        """
        列出草稿
        
        Args:
            status: 筛选状态
            kanban_status: 筛选看板状态
            skip: 跳过数量
            limit: 限制数量
            
        Returns:
            草稿列表
        """
        q = self.db.query(Draft)
        
        if status:
            q = q.filter(Draft.status == status)
        if kanban_status:
            q = q.filter(Draft.kanban_status == kanban_status)
        
        return q.order_by(Draft.updated_at.desc()).offset(skip).limit(limit).all()
    
    def delete_draft(self, draft_id: int) -> bool:
        """删除草稿"""
        draft = self.db.query(Draft).filter(Draft.id == draft_id).first()
        if not draft:
            return False
        
        self.db.delete(draft)
        self.db.commit()
        return True
    
    def get_draft_versions(self, draft_id: int) -> List[DraftVersion]:
        """获取草稿版本历史"""
        return self.db.query(DraftVersion).filter(
            DraftVersion.draft_id == draft_id
        ).order_by(DraftVersion.version_number.desc()).all()
    
    def restore_version(self, draft_id: int, version_number: int) -> Optional[Draft]:
        """恢复到指定版本"""
        draft = self.db.query(Draft).filter(Draft.id == draft_id).first()
        if not draft:
            return None
        
        version = self.db.query(DraftVersion).filter(
            DraftVersion.draft_id == draft_id,
            DraftVersion.version_number == version_number
        ).first()
        
        if not version:
            return None
        
        # 创建当前版本的备份
        self._create_version(draft, f"恢复到版本 {version_number}")
        
        # 恢复内容
        draft.content = version.content
        draft.updated_at = datetime.now()
        self._analyze_content(draft)
        self.db.commit()
        self.db.refresh(draft)
        return draft
    
    def _create_version(self, draft: Draft, change_summary: Optional[str] = None) -> DraftVersion:
        """创建版本记录"""
        # 获取最新版本号
        latest_version = self.db.query(DraftVersion).filter(
            DraftVersion.draft_id == draft.id
        ).order_by(DraftVersion.version_number.desc()).first()
        
        next_version = (latest_version.version_number + 1) if latest_version else 1
        
        version = DraftVersion(
            draft_id=draft.id,
            version_number=next_version,
            content=draft.content,
            change_summary=change_summary
        )
        self.db.add(version)
        self.db.commit()
        return version
    
    def _analyze_content(self, draft: Draft) -> None:
        """分析内容（字数、阅读时间、SEO评分）"""
        content = draft.content
        
        # 计算字数
        draft.word_count = len(content)
        
        # 计算阅读时间（假设平均每分钟300字）
        draft.reading_time = max(1, draft.word_count // 300)
        
        # 计算SEO评分
        draft.seo_score = self._calculate_seo_score(draft)
        
        # 计算质量评分
        draft.quality_score = self._calculate_quality_score(draft)
    
    def _calculate_seo_score(self, draft: Draft) -> int:
        """计算SEO评分 (0-100)"""
        score = 0
        
        # 标题长度 (20分)
        if 10 <= len(draft.title) <= 60:
            score += 20
        elif len(draft.title) > 0:
            score += 10
        
        # 内容长度 (30分)
        if draft.word_count >= 300:
            score += 30
        elif draft.word_count >= 100:
            score += 20
        elif draft.word_count > 0:
            score += 10
        
        # 标题在内容中出现 (20分)
        if draft.title.lower() in draft.content.lower():
            score += 20
        
        # 段落结构 (20分)
        paragraphs = draft.content.split('\n\n')
        if len(paragraphs) >= 3:
            score += 20
        elif len(paragraphs) >= 2:
            score += 10
        
        # 关键词密度 (10分)
        words = draft.content.lower().split()
        if len(words) > 0:
            title_words = draft.title.lower().split()
            keyword_count = sum(1 for w in words if w in title_words)
            keyword_density = keyword_count / len(words)
            if 0.01 <= keyword_density <= 0.05:
                score += 10
        
        return min(100, score)
    
    def _calculate_quality_score(self, draft: Draft) -> int:
        """计算质量评分 (0-100)"""
        score = 0
        
        # 内容长度 (30分)
        if draft.word_count >= 500:
            score += 30
        elif draft.word_count >= 300:
            score += 20
        elif draft.word_count >= 100:
            score += 10
        
        # 标题质量 (20分)
        if len(draft.title) >= 10:
            score += 20
        elif len(draft.title) >= 5:
            score += 10
        
        # 内容结构 (30分)
        paragraphs = draft.content.split('\n\n')
        if len(paragraphs) >= 5:
            score += 30
        elif len(paragraphs) >= 3:
            score += 20
        elif len(paragraphs) >= 2:
            score += 10
        
        # 标点符号使用 (20分)
        punctuation_count = sum(1 for c in draft.content if c in '.,!?;:')
        if draft.word_count > 0:
            punctuation_ratio = punctuation_count / draft.word_count
            if 0.05 <= punctuation_ratio <= 0.15:
                score += 20
            elif punctuation_ratio > 0:
                score += 10
        
        return min(100, score)
    
    def get_kanban_view(self) -> Dict[str, List[Draft]]:
        """获取看板视图"""
        drafts = self.db.query(Draft).all()
        
        kanban = {
            "todo": [],
            "in_progress": [],
            "done": []
        }
        
        for draft in drafts:
            status = draft.kanban_status or "todo"
            if status in kanban:
                kanban[status].append(draft)
        
        return kanban

