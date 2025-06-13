"""
AI Native功能集成测试
"""
import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.models import Base
from app.db import get_db

# 创建测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ai_native.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """覆盖数据库依赖"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    """设置测试数据库"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    """创建测试客户端"""
    return TestClient(app)

class TestAINativeConversationFlow:
    """测试AI Native对话流程"""
    
    def test_complete_conversation_flow(self, client, setup_database):
        """测试完整的对话流程"""
        
        # 1. 开始对话
        response = client.post("/api/ai-native/conversations", json={
            "user_intent": "我想创建一个企业官网"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "conversation_started"
        assert "run_id" in data
        assert "next_action" in data
        
        run_id = data["run_id"]
        next_action = data["next_action"]
        
        # 验证第一个行动应该是询问槽位
        assert next_action["action"] == "ask_slot"
        assert "slot_name" in next_action
        
        # 2. 回答第一个槽位问题
        slot_name = next_action["slot_name"]
        response = client.post(f"/api/ai-native/conversations/{run_id}/input", json={
            "user_input": "企业官网",
            "context": {"slot_name": slot_name}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] in ["ask_slot", "plan"]
        
        # 3. 继续填充槽位直到可以生成内容
        max_iterations = 5  # 防止无限循环
        iteration = 0
        
        while iteration < max_iterations:
            if data["data"]["action"] == "ask_slot":
                slot_name = data["data"]["slot_name"]
                
                # 根据槽位类型提供合适的回答
                if slot_name == "brand_name":
                    user_input = "GeoCMS科技"
                elif slot_name == "target_audience":
                    user_input = "中小企业主"
                elif slot_name == "content_goals":
                    user_input = "品牌展示"
                else:
                    user_input = "默认值"
                
                response = client.post(f"/api/ai-native/conversations/{run_id}/input", json={
                    "user_input": user_input,
                    "context": {"slot_name": slot_name}
                })
                
                assert response.status_code == 200
                data = response.json()
                iteration += 1
            else:
                break
        
        # 4. 检查对话状态
        response = client.get(f"/api/ai-native/conversations/{run_id}/status")
        assert response.status_code == 200
        status_data = response.json()
        
        assert status_data["run_id"] == run_id
        assert "current_state" in status_data
        assert "progress" in status_data
        assert "tasks" in status_data
        
        # 5. 生成内容
        response = client.post(f"/api/ai-native/conversations/{run_id}/generate", json={
            "task_data": {"page_type": "homepage"}
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "content_generated"
        assert "content_block_id" in data["data"]
        
        # 6. 完成对话
        response = client.post(f"/api/ai-native/conversations/{run_id}/complete")
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "conversation_completed"
    
    def test_conversation_with_missing_knowledge(self, client, setup_database):
        """测试缺失知识的对话流程"""
        
        # 开始对话
        response = client.post("/api/ai-native/conversations", json={
            "user_intent": "为我们公司创建介绍页面"
        })
        
        assert response.status_code == 200
        data = response.json()
        run_id = data["run_id"]
        
        # 填充必要槽位
        response = client.post(f"/api/ai-native/conversations/{run_id}/input", json={
            "user_input": "企业官网",
            "context": {"slot_name": "site_type"}
        })
        
        # 继续对话直到遇到知识缺失或可以生成内容
        # 这个测试主要验证系统能够处理知识缺失的情况
        assert response.status_code == 200

class TestAINativeAPI:
    """测试AI Native API端点"""
    
    def test_health_check(self, client):
        """测试健康检查"""
        response = client.get("/api/ai-native/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai_native_api"
    
    def test_start_conversation_invalid_input(self, client, setup_database):
        """测试无效输入的对话开始"""
        response = client.post("/api/ai-native/conversations", json={
            "user_intent": ""
        })
        
        # 应该能处理空输入
        assert response.status_code in [200, 400]
    
    def test_process_input_nonexistent_conversation(self, client, setup_database):
        """测试处理不存在对话的输入"""
        response = client.post("/api/ai-native/conversations/999/input", json={
            "user_input": "测试输入"
        })
        
        assert response.status_code == 400
    
    def test_get_status_nonexistent_conversation(self, client, setup_database):
        """测试获取不存在对话的状态"""
        response = client.get("/api/ai-native/conversations/999/status")
        
        assert response.status_code == 404
    
    def test_workflow_execution(self, client, setup_database):
        """测试工作流执行"""
        # 先创建对话
        response = client.post("/api/ai-native/conversations", json={
            "user_intent": "创建网站"
        })
        
        assert response.status_code == 200
        run_id = response.json()["run_id"]
        
        # 执行标准工作流
        response = client.post(f"/api/ai-native/conversations/{run_id}/workflow", json={
            "workflow_type": "standard"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "workflow_executed"
        assert "data" in data

class TestAINativeErrorHandling:
    """测试AI Native错误处理"""
    
    def test_invalid_workflow_type(self, client, setup_database):
        """测试无效的工作流类型"""
        # 先创建对话
        response = client.post("/api/ai-native/conversations", json={
            "user_intent": "创建网站"
        })
        
        run_id = response.json()["run_id"]
        
        # 使用无效的工作流类型
        response = client.post(f"/api/ai-native/conversations/{run_id}/workflow", json={
            "workflow_type": "invalid_workflow"
        })
        
        assert response.status_code == 400
    
    def test_verify_nonexistent_content(self, client, setup_database):
        """测试校验不存在的内容"""
        # 先创建对话
        response = client.post("/api/ai-native/conversations", json={
            "user_intent": "创建网站"
        })
        
        run_id = response.json()["run_id"]
        
        # 尝试校验不存在的内容
        response = client.post(f"/api/ai-native/conversations/{run_id}/verify/999")
        
        assert response.status_code == 400

class TestBackwardCompatibility:
    """测试向后兼容性"""
    
    def test_legacy_api_still_works(self, client, setup_database):
        """测试传统API仍然工作"""
        # 测试传统的run-prompt API
        response = client.post("/api/run-prompt", json={
            "prompt": "写一篇关于人工智能的文章"
        })
        
        # 应该仍然能正常工作
        assert response.status_code == 200
        data = response.json()
        assert "content" in data or "missing_knowledge" in data
    
    def test_knowledge_api_still_works(self, client, setup_database):
        """测试知识库API仍然工作"""
        # 测试知识库API
        response = client.get("/api/knowledge")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
