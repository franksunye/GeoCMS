import pytest
from app.models import AgentPrompt, ContentBlock

def test_full_flow(client):
    """测试完整的提示词处理流程"""
    # 1. 发送提示词
    test_prompt = "写一篇关于人工智能的文章"
    response = client.post(
        "/api/run-prompt",
        json={"prompt": test_prompt}
    )
    assert response.status_code == 200

    # 2. 验证响应结构
    data = response.json()

    # 检查是否是缺失知识的响应
    if data.get("status") == "missing_knowledge":
        assert "missing_knowledge" in data
        assert "prompt_id" in data
        return  # 缺失知识是正常情况，测试通过

    # 正常生成内容的响应
    assert data.get("status") == "success"
    assert "content" in data
    assert "id" in data
    assert "prompt_id" in data
    assert "content_type" in data

    # 3. 验证内容是结构化的（因为使用了Mock数据）
    content = data["content"]
    assert isinstance(content, dict)
    assert "title" in content
    assert "headings" in content
    assert "paragraphs" in content
    assert "faqs" in content

    # 4. 验证ID字段
    assert isinstance(data["id"], int)
    assert isinstance(data["prompt_id"], int)
    assert data["content_type"] in ["structured", "text"]

def test_error_flow(client):
    """测试错误处理流程"""
    # 1. 测试空提示词
    response = client.post(
        "/api/run-prompt",
        json={"prompt": ""}
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "提示词不能为空" in detail or "请求体不能为空" in detail

    # 2. 测试无效的请求体
    response = client.post(
        "/api/run-prompt",
        json={}
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "提示词不能为空" in detail or "请求体不能为空" in detail

    # 3. 测试无效的提示词类型
    response = client.post(
        "/api/run-prompt",
        json={"prompt": 123}
    )
    assert response.status_code == 422
    assert "提示词必须是字符串类型" in response.json()["detail"]