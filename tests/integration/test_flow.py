import pytest
from app.models import AgentPrompt, ContentBlock

def test_full_flow(client, mock_db, mock_openai_response):
    """测试完整的提示词处理流程"""
    # 1. 发送提示词
    test_prompt = "这是一个端到端测试提示词"
    response = client.post(
        "/run-prompt",
        json={"prompt": test_prompt}
    )
    assert response.status_code == 200
    
    # 2. 验证响应
    data = response.json()
    assert "content" in data
    assert data["content"] == "这是一个模拟的响应"
    
    # 3. 验证数据库操作
    mock_db.add.assert_called()
    mock_db.commit.assert_called()
    
    # 4. 验证数据库查询
    prompt = mock_db.query(AgentPrompt).filter(AgentPrompt.prompt_text == test_prompt).first()
    assert prompt is not None
    
    content = mock_db.query(ContentBlock).filter(ContentBlock.prompt_id == prompt.id).first()
    assert content is not None
    assert content.content == "这是一个模拟的响应"

def test_error_flow(client, mock_db):
    """测试错误处理流程"""
    # 1. 模拟 LLM 错误
    with pytest.raises(Exception):
        response = client.post(
            "/run-prompt",
            json={"prompt": "触发错误的提示词"}
        )
    
    # 2. 验证数据库回滚
    mock_db.rollback.assert_called() 