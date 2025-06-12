"""
测试知识库 API
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

class TestKnowledgeAPI:
    """测试知识库 API"""
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_create_knowledge(self, mock_service_class, mock_get_db):
        """测试创建知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_knowledge.topic = "company_info"
        mock_knowledge.content = '{"name": "测试公司"}'
        mock_knowledge.description = "公司信息"
        mock_knowledge.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_service.create_knowledge.return_value = mock_knowledge
        
        # 发送请求
        response = client.post("/api/knowledge", json={
            "topic": "company_info",
            "content": {"name": "测试公司"},
            "description": "公司信息"
        })
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == "company_info"
        assert data["content"]["name"] == "测试公司"
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_list_knowledge(self, mock_service_class, mock_get_db):
        """测试获取知识列表"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_knowledge.topic = "company_info"
        mock_knowledge.content = '{"name": "测试公司"}'
        mock_knowledge.description = "公司信息"
        mock_knowledge.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_service.get_all_knowledge.return_value = [mock_knowledge]
        
        # 发送请求
        response = client.get("/api/knowledge")
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["topic"] == "company_info"
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_get_knowledge_by_topic(self, mock_service_class, mock_get_db):
        """测试根据主题获取知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_knowledge.topic = "company_info"
        mock_knowledge.content = '{"name": "测试公司"}'
        mock_knowledge.description = "公司信息"
        mock_knowledge.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_service.get_knowledge_by_topic.return_value = mock_knowledge
        
        # 发送请求
        response = client.get("/api/knowledge/company_info")
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == "company_info"
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_get_knowledge_by_topic_not_found(self, mock_service_class, mock_get_db):
        """测试获取不存在的知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_service.get_knowledge_by_topic.return_value = None
        
        # 发送请求
        response = client.get("/api/knowledge/nonexistent")
        
        # 验证响应
        assert response.status_code == 404
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_update_knowledge(self, mock_service_class, mock_get_db):
        """测试更新知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_knowledge.topic = "company_info"
        mock_knowledge.content = '{"name": "更新后的公司"}'
        mock_knowledge.description = "更新后的描述"
        mock_knowledge.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge.updated_at.isoformat.return_value = "2023-01-01T01:00:00"
        
        mock_service.update_knowledge.return_value = mock_knowledge
        
        # 发送请求
        response = client.put("/api/knowledge/1", json={
            "content": {"name": "更新后的公司"},
            "description": "更新后的描述"
        })
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["content"]["name"] == "更新后的公司"
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_delete_knowledge(self, mock_service_class, mock_get_db):
        """测试删除知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_service.delete_knowledge.return_value = True
        
        # 发送请求
        response = client.delete("/api/knowledge/1")
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert "删除成功" in data["message"]
    
    def test_list_knowledge_templates(self):
        """测试获取知识模板列表"""
        response = client.get("/api/knowledge/templates/list")
        
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "details" in data
        assert "company_info" in data["templates"]
    
    def test_get_knowledge_template_by_type(self):
        """测试根据类型获取知识模板"""
        response = client.get("/api/knowledge/templates/company_info")
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "company_info"
        assert "template" in data
        assert "name" in data["template"]
    
    def test_get_knowledge_template_by_type_not_found(self):
        """测试获取不存在的知识模板"""
        response = client.get("/api/knowledge/templates/nonexistent")
        
        assert response.status_code == 404
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_search_knowledge(self, mock_service_class, mock_get_db):
        """测试搜索知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_knowledge.topic = "company_info"
        mock_knowledge.content = '{"name": "测试公司"}'
        mock_knowledge.description = "公司信息"
        mock_knowledge.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_service.search_knowledge.return_value = [mock_knowledge]
        
        # 发送请求
        response = client.post("/api/knowledge/search", json=["公司"])
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["topic"] == "company_info"
    
    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_get_knowledge_stats(self, mock_service_class, mock_get_db):
        """测试获取知识库统计"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_knowledge1 = MagicMock()
        mock_knowledge1.topic = "company_info"
        mock_knowledge2 = MagicMock()
        mock_knowledge2.topic = "product_info"
        
        mock_service.get_all_knowledge.return_value = [mock_knowledge1, mock_knowledge2]
        
        # 发送请求
        response = client.get("/api/knowledge/stats/summary")
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["total_knowledge"] == 2
        assert "topic_counts" in data
        assert "available_templates" in data
