"""
测试草稿服务 - Sprint 5
"""
import pytest
from datetime import datetime, timedelta
from app.services.draft_service import DraftService
from app.models import Draft, DraftVersion

class TestDraftService:
    """测试草稿服务"""
    
    def test_create_draft(self, mock_db):
        """测试创建草稿"""
        service = DraftService(mock_db)
        
        draft = service.create_draft(
            title="测试草稿",
            content="这是一个测试草稿内容。" * 50
        )
        
        assert draft.title == "测试草稿"
        assert draft.status == "draft"
        assert draft.kanban_status == "todo"
        assert draft.word_count > 0
        assert draft.reading_time > 0
        mock_db.add.assert_called()
        mock_db.commit.assert_called()
    
    def test_create_draft_with_template(self, mock_db):
        """测试使用模板创建草稿"""
        service = DraftService(mock_db)
        
        draft = service.create_draft(
            title="从模板创建",
            content="内容",
            template_id=1
        )
        
        assert draft.template_id == 1
    
    def test_update_draft(self, mock_db):
        """测试更新草稿"""
        service = DraftService(mock_db)
        
        # 创建初始草稿
        draft = Draft(
            id=1,
            title="原始标题",
            content="原始内容",
            status="draft",
            kanban_status="todo"
        )
        mock_db.query.return_value.filter.return_value.first.return_value = draft
        
        # 更新草稿
        updated = service.update_draft(
            draft_id=1,
            title="新标题",
            content="新内容",
            status="review"
        )
        
        assert updated.title == "新标题"
        assert updated.status == "review"
    
    def test_get_draft(self, mock_db):
        """测试获取草稿"""
        service = DraftService(mock_db)
        
        draft = Draft(id=1, title="测试", content="内容")
        mock_db.query.return_value.filter.return_value.first.return_value = draft
        
        result = service.get_draft(1)
        
        assert result.id == 1
        assert result.title == "测试"
    
    def test_list_drafts(self, mock_db):
        """测试列出草稿"""
        service = DraftService(mock_db)
        
        drafts = [
            Draft(id=1, title="草稿1", content="内容1", status="draft"),
            Draft(id=2, title="草稿2", content="内容2", status="review")
        ]
        mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = drafts
        
        result = service.list_drafts(status="draft")
        
        assert len(result) == 2
    
    def test_delete_draft(self, mock_db):
        """测试删除草稿"""
        service = DraftService(mock_db)
        
        draft = Draft(id=1, title="测试", content="内容")
        mock_db.query.return_value.filter.return_value.first.return_value = draft
        
        result = service.delete_draft(1)
        
        assert result is True
        mock_db.delete.assert_called()
    
    def test_delete_draft_not_found(self, mock_db):
        """测试删除不存在的草稿"""
        service = DraftService(mock_db)
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.delete_draft(999)
        
        assert result is False
    
    def test_get_kanban_view(self, mock_db):
        """测试获取看板视图"""
        service = DraftService(mock_db)
        
        drafts = [
            Draft(id=1, title="任务1", content="内容", kanban_status="todo"),
            Draft(id=2, title="任务2", content="内容", kanban_status="in_progress"),
            Draft(id=3, title="任务3", content="内容", kanban_status="done")
        ]
        mock_db.query.return_value.all.return_value = drafts
        
        result = service.get_kanban_view()
        
        assert len(result["todo"]) == 1
        assert len(result["in_progress"]) == 1
        assert len(result["done"]) == 1
    
    def test_calculate_seo_score(self, mock_db):
        """测试SEO评分计算"""
        service = DraftService(mock_db)
        
        draft = Draft(
            title="这是一个很好的标题",
            content="这是内容。" * 100
        )
        
        score = service._calculate_seo_score(draft)
        
        assert 0 <= score <= 100
        assert score > 0  # 应该有一些分数
    
    def test_calculate_quality_score(self, mock_db):
        """测试质量评分计算"""
        service = DraftService(mock_db)
        
        draft = Draft(
            title="高质量标题",
            content="这是高质量内容。\n\n第二段。\n\n第三段。\n\n第四段。\n\n第五段。"
        )
        
        score = service._calculate_quality_score(draft)
        
        assert 0 <= score <= 100
        assert score > 0
    
    def test_analyze_content(self, mock_db):
        """测试内容分析"""
        service = DraftService(mock_db)
        
        draft = Draft(
            title="测试",
            content="这是测试内容。" * 100
        )
        
        service._analyze_content(draft)
        
        assert draft.word_count > 0
        assert draft.reading_time > 0
        assert draft.seo_score >= 0
        assert draft.quality_score >= 0
    
    def test_restore_version(self, mock_db):
        """测试恢复版本"""
        service = DraftService(mock_db)
        
        draft = Draft(id=1, title="当前", content="当前内容")
        version = DraftVersion(
            id=1,
            draft_id=1,
            version_number=1,
            content="旧内容"
        )
        
        mock_db.query.return_value.filter.return_value.first.return_value = draft
        mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = version
        
        result = service.restore_version(1, 1)
        
        assert result is not None

