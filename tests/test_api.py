import pytest
from fastapi.testclient import TestClient
from app.models import AgentPrompt, ContentBlock
from sqlalchemy.orm import Session

# 测试 /run-prompt 端点
def test_run_prompt_endpoint(client):
    """测试 /run-prompt 端点是否正常工作"""
    test_prompt = "这是一个测试提示词"
    
    # 发送 POST 请求
    response = client.post(
        "/run-prompt",
        json={"prompt": test_prompt}
    )
    
    # 验证响应状态码和结构
    assert response.status_code == 200
    data = response.json()
    assert "prompt_id" in data
    assert "block_id" in data
    assert "content" in data
    
    # 验证返回的内容不为空
    assert data["content"] != ""

# 测试数据库集成
def test_database_integration(client, db: Session):
    """测试数据库集成是否正常工作"""
    # 准备测试数据
    test_prompt = "另一个测试提示词"
    
    # 调用 API
    response = client.post(
        "/run-prompt",
        json={"prompt": test_prompt}
    )
    assert response.status_code == 200
    data = response.json()
    
    # 验证数据库中的记录
    prompt = db.query(AgentPrompt).filter(AgentPrompt.id == data["prompt_id"]).first()
    assert prompt is not None
    assert prompt.prompt_text == test_prompt
    
    content_block = db.query(ContentBlock).filter(ContentBlock.id == data["block_id"]).first()
    assert content_block is not None
    assert content_block.prompt_id == data["prompt_id"]
    assert content_block.content == data["content"]

# 测试空提示词
def test_empty_prompt(client):
    """测试空提示词的处理"""
    response = client.post(
        "/run-prompt",
        json={"prompt": ""}
    )
    assert response.status_code == 200  # 或者您希望返回 400 等错误状态码
    data = response.json()
    assert "content" in data
