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

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_create_knowledge_error(self, mock_service_class, mock_get_db):
        """测试创建知识时的错误处理"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟服务层抛出异常
        mock_service.create_knowledge.side_effect = Exception("创建失败")
        
        # 发送请求
        response = client.post("/api/knowledge", json={
            "topic": "company_info",
            "content": {"name": "测试公司"},
            "description": "公司信息"
        })
        
        # 验证响应
        assert response.status_code == 500
        assert "创建知识失败" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_update_knowledge_not_found(self, mock_service_class, mock_get_db):
        """测试更新不存在的知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_service.update_knowledge.return_value = None
        
        # 发送请求
        response = client.put("/api/knowledge/999", json={
            "content": {"name": "更新后的公司"},
            "description": "更新后的描述"
        })
        
        # 验证响应
        assert response.status_code == 404
        assert "未找到" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_delete_knowledge_not_found(self, mock_service_class, mock_get_db):
        """测试删除不存在的知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        mock_service.delete_knowledge.return_value = False
        
        # 发送请求
        response = client.delete("/api/knowledge/999")
        
        # 验证响应
        assert response.status_code == 404
        assert "未找到" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_batch_create_knowledge(self, mock_service_class, mock_get_db):
        """测试批量创建知识"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟创建的知识对象
        mock_knowledge1 = MagicMock()
        mock_knowledge1.id = 1
        mock_knowledge1.topic = "company_info"
        mock_knowledge1.content = '{"name": "公司1"}'
        mock_knowledge1.description = "公司1信息"
        mock_knowledge1.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge1.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_knowledge2 = MagicMock()
        mock_knowledge2.id = 2
        mock_knowledge2.topic = "product_info"
        mock_knowledge2.content = '{"name": "产品1"}'
        mock_knowledge2.description = "产品1信息"
        mock_knowledge2.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge2.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_service.create_knowledge.side_effect = [mock_knowledge1, mock_knowledge2]
        
        # 发送请求
        response = client.post("/api/knowledge/batch", json=[
            {
                "topic": "company_info",
                "content": {"name": "公司1"},
                "description": "公司1信息"
            },
            {
                "topic": "product_info",
                "content": {"name": "产品1"},
                "description": "产品1信息"
            }
        ])
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert "成功创建" in data["message"]
        assert len(data["knowledge"]) == 2
        assert data["knowledge"][0]["topic"] == "company_info"
        assert data["knowledge"][1]["topic"] == "product_info"

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_batch_create_knowledge_error(self, mock_service_class, mock_get_db):
        """测试批量创建知识时的错误处理"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟服务层抛出异常
        mock_service.create_knowledge.side_effect = Exception("批量创建失败")
        
        # 发送请求
        response = client.post("/api/knowledge/batch", json=[
            {
                "topic": "company_info",
                "content": {"name": "公司1"},
                "description": "公司1信息"
            }
        ])
        
        # 验证响应
        assert response.status_code == 500
        assert "批量创建知识失败" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_get_knowledge_stats(self, mock_service_class, mock_get_db):
        """测试获取知识库统计信息"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟知识库数据
        mock_knowledge1 = MagicMock()
        mock_knowledge1.topic = "company_info"
        mock_knowledge2 = MagicMock()
        mock_knowledge2.topic = "product_info"
        mock_knowledge3 = MagicMock()
        mock_knowledge3.topic = "company_info"
        
        mock_service.get_all_knowledge.return_value = [
            mock_knowledge1, mock_knowledge2, mock_knowledge3
        ]
        
        # 发送请求
        response = client.get("/api/knowledge/stats/summary")
        
        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert data["total_knowledge"] == 3
        assert data["topic_counts"]["company_info"] == 2
        assert data["topic_counts"]["product_info"] == 1
        assert "available_templates" in data

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_get_knowledge_stats_error(self, mock_service_class, mock_get_db):
        """测试获取知识库统计信息时的错误处理"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟服务层抛出异常
        mock_service.get_all_knowledge.side_effect = Exception("获取统计信息失败")
        
        # 发送请求
        response = client.get("/api/knowledge/stats/summary")
        
        # 验证响应
        assert response.status_code == 500
        assert "获取统计信息失败" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_list_knowledge_error(self, mock_service_class, mock_get_db):
        """测试获取知识列表时的错误处理"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟服务层抛出异常
        mock_service.get_all_knowledge.side_effect = Exception("获取列表失败")
        
        # 发送请求
        response = client.get("/api/knowledge")
        
        # 验证响应
        assert response.status_code == 500
        assert "获取知识列表失败" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_search_knowledge_error(self, mock_service_class, mock_get_db):
        """测试搜索知识时的错误处理"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟服务层抛出异常
        mock_service.search_knowledge.side_effect = Exception("搜索失败")
        
        # 发送请求
        response = client.post("/api/knowledge/search", json=["关键词"])
        
        # 验证响应
        assert response.status_code == 500
        assert "搜索知识失败" in response.json()["detail"]

    @patch('app.api.knowledge.get_db')
    @patch('app.api.knowledge.KnowledgeService')
    def test_batch_create_knowledge_partial_error(self, mock_service_class, mock_get_db):
        """测试批量创建知识时的部分失败场景"""
        # 设置 mock
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # 模拟第一个成功，第二个失败
        mock_knowledge = MagicMock()
        mock_knowledge.id = 1
        mock_knowledge.topic = "company_info"
        mock_knowledge.content = '{"name": "公司1"}'
        mock_knowledge.description = "公司1信息"
        mock_knowledge.created_at.isoformat.return_value = "2023-01-01T00:00:00"
        mock_knowledge.updated_at.isoformat.return_value = "2023-01-01T00:00:00"
        
        mock_service.create_knowledge.side_effect = [
            mock_knowledge,
            Exception("第二个创建失败")
        ]
        
        # 发送请求
        response = client.post("/api/knowledge/batch", json=[
            {
                "topic": "company_info",
                "content": {"name": "公司1"},
                "description": "公司1信息"
            },
            {
                "topic": "product_info",
                "content": {"name": "产品1"},
                "description": "产品1信息"
            }
        ])
        
        # 验证响应
        assert response.status_code == 500
        assert "批量创建知识失败" in response.json()["detail"]
