"""
测试知识库服务
"""
import pytest
from unittest.mock import MagicMock
from app.services.knowledge import KnowledgeService, infer_knowledge_needs, get_knowledge_template
from app.models import KnowledgeBase

class TestKnowledgeService:
    """测试知识库服务"""
    
    def test_create_knowledge(self, mock_db):
        """测试创建知识"""
        service = KnowledgeService(mock_db)
        
        content = {"name": "测试公司", "description": "测试描述"}
        knowledge = service.create_knowledge("company_info", content, "公司信息")
        
        assert knowledge.topic == "company_info"
        assert knowledge.description == "公司信息"
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
    
    def test_get_knowledge_by_topic(self, mock_db):
        """测试根据主题获取知识"""
        service = KnowledgeService(mock_db)
        
        # 模拟查询结果
        mock_knowledge = MagicMock()
        mock_knowledge.topic = "company_info"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_knowledge
        
        result = service.get_knowledge_by_topic("company_info")
        
        assert result == mock_knowledge
        mock_db.query.assert_called_with(KnowledgeBase)
    
    def test_get_all_knowledge(self, mock_db):
        """测试获取所有知识"""
        service = KnowledgeService(mock_db)
        
        mock_knowledge_list = [MagicMock(), MagicMock()]
        mock_db.query.return_value.all.return_value = mock_knowledge_list
        
        result = service.get_all_knowledge()
        
        assert result == mock_knowledge_list
        mock_db.query.assert_called_with(KnowledgeBase)
    
    def test_update_knowledge(self, mock_db):
        """测试更新知识"""
        service = KnowledgeService(mock_db)
        
        mock_knowledge = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_knowledge
        
        new_content = {"name": "更新后的公司"}
        result = service.update_knowledge(1, content=new_content)
        
        assert result == mock_knowledge
        mock_db.commit.assert_called_once()
    
    def test_delete_knowledge(self, mock_db):
        """测试删除知识"""
        service = KnowledgeService(mock_db)
        
        mock_knowledge = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_knowledge
        
        result = service.delete_knowledge(1)
        
        assert result is True
        mock_db.delete.assert_called_once_with(mock_knowledge)
        mock_db.commit.assert_called_once()
    
    def test_delete_knowledge_not_found(self, mock_db):
        """测试删除不存在的知识"""
        service = KnowledgeService(mock_db)
        
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = service.delete_knowledge(999)
        
        assert result is False
        mock_db.delete.assert_not_called()
    
    def test_search_knowledge(self, mock_db):
        """测试搜索知识"""
        service = KnowledgeService(mock_db)
        
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_knowledge]
        
        result = service.search_knowledge(["公司"])
        
        assert len(result) == 1
        assert result[0] == mock_knowledge
    
    def test_get_knowledge_content(self, mock_db):
        """测试获取知识内容"""
        service = KnowledgeService(mock_db)
        
        mock_knowledge = MagicMock()
        mock_knowledge.content = '{"name": "测试公司"}'
        
        result = service.get_knowledge_content(mock_knowledge)
        
        assert result == {"name": "测试公司"}
    
    def test_get_knowledge_content_invalid_json(self, mock_db):
        """测试获取无效JSON知识内容"""
        service = KnowledgeService(mock_db)
        
        mock_knowledge = MagicMock()
        mock_knowledge.content = 'invalid json'
        
        result = service.get_knowledge_content(mock_knowledge)
        
        assert "error" in result

    def test_create_knowledge_empty_topic(self, mock_db):
        """测试创建知识时topic为空"""
        service = KnowledgeService(mock_db)
        content = {"name": "测试公司"}
        knowledge = service.create_knowledge("", content)
        assert knowledge.topic == ""

    def test_create_knowledge_content_none(self, mock_db):
        """测试创建知识时content为None"""
        service = KnowledgeService(mock_db)
        knowledge = service.create_knowledge("company_info", None)
        assert knowledge.content == "null"

    def test_update_knowledge_not_found(self, mock_db):
        """测试更新不存在的知识"""
        service = KnowledgeService(mock_db)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        result = service.update_knowledge(999, topic="new_topic")
        assert result is None

    def test_search_knowledge_empty_keywords(self, mock_db):
        """测试搜索知识时关键词为空"""
        service = KnowledgeService(mock_db)
        result = service.search_knowledge([])
        assert result == []

    def test_get_knowledge_content_invalid_json_type(self, mock_db):
        """测试知识内容为非字符串类型时的异常"""
        service = KnowledgeService(mock_db)
        mock_knowledge = MagicMock()
        mock_knowledge.content = 12345  # 非字符串
        result = service.get_knowledge_content(mock_knowledge)
        assert "error" in result

class TestKnowledgeUtils:
    """测试知识库工具函数"""
    
    def test_infer_knowledge_needs_company(self):
        """测试推断公司信息需求"""
        prompt = "为我们公司写一个介绍页面"
        result = infer_knowledge_needs(prompt)
        
        assert "company_info" in result
    
    def test_infer_knowledge_needs_product(self):
        """测试推断产品信息需求"""
        prompt = "创建一个产品介绍页面"
        result = infer_knowledge_needs(prompt)
        
        assert "product_info" in result
    
    def test_infer_knowledge_needs_brand(self):
        """测试推断品牌信息需求"""
        prompt = "设计品牌展示页面"
        result = infer_knowledge_needs(prompt)
        
        assert "brand_info" in result
    
    def test_infer_knowledge_needs_service(self):
        """测试推断服务信息需求"""
        prompt = "创建服务介绍页面"
        result = infer_knowledge_needs(prompt)
        
        assert "service_info" in result
    
    def test_infer_knowledge_needs_multiple(self):
        """测试推断多种知识需求"""
        prompt = "为我们公司的产品创建一个完整的介绍页面"
        result = infer_knowledge_needs(prompt)
        
        assert "company_info" in result
        assert "product_info" in result
    
    def test_infer_knowledge_needs_none(self):
        """测试不需要特定知识的情况"""
        prompt = "写一篇关于天气的文章"
        result = infer_knowledge_needs(prompt)
        
        assert len(result) == 0
    
    def test_get_knowledge_template_company(self):
        """测试获取公司信息模板"""
        template = get_knowledge_template("company_info")
        
        assert "name" in template
        assert "description" in template
        assert "mission" in template
    
    def test_get_knowledge_template_product(self):
        """测试获取产品信息模板"""
        template = get_knowledge_template("product_info")
        
        assert "name" in template
        assert "description" in template
        assert "features" in template
    
    def test_get_knowledge_template_invalid(self):
        """测试获取无效模板"""
        template = get_knowledge_template("invalid_type")
        
        assert template == {}

@pytest.fixture
def mock_db():
    """Mock数据库会话"""
    mock_session = MagicMock()
    
    # 模拟自增ID
    _id_counter = {'knowledge': 1}
    
    def add_side_effect(obj):
        if isinstance(obj, KnowledgeBase) and obj.id is None:
            obj.id = _id_counter['knowledge']
            _id_counter['knowledge'] += 1
    
    def refresh_side_effect(obj):
        if isinstance(obj, KnowledgeBase) and obj.id is None:
            obj.id = _id_counter['knowledge']
            _id_counter['knowledge'] += 1
    
    mock_session.add.side_effect = add_side_effect
    mock_session.commit.side_effect = lambda: None
    mock_session.refresh.side_effect = refresh_side_effect
    
    return mock_session
