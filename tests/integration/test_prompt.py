# 本文件为接口级（集成）测试，已从 unit/api 目录迁移到 integration 目录
# 使用 FastAPI TestClient 进行接口测试
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

def test_run_prompt_endpoint(client, mock_openai_response, test_prompt):
    """测试 /run-prompt 端点是否正常工作"""
    response = client.post(
        "/run-prompt",
        json={"prompt": test_prompt}
    )
    print("DEBUG response.json():", response.json())
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert data["content"] == "这是一个模拟的响应"

def test_empty_prompt(client, mock_openai_response):
    """测试空提示词的处理"""
    response = client.post(
        "/run-prompt",
        json={"prompt": ""}
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert response.json()["detail"] == "提示词不能为空"

def test_invalid_prompt_type(client, mock_openai_response):
    """测试无效的提示词类型"""
    response = client.post(
        "/run-prompt",
        json={"prompt": 123}  # 发送数字而不是字符串
    )
    assert response.status_code == 422
    assert "detail" in response.json()
    assert response.json()["detail"] == "提示词必须是字符串类型"

def test_missing_prompt_field(client, mock_openai_response):
    """测试缺少提示词字段"""
    response = client.post(
        "/run-prompt",
        json={}  # 不发送 prompt 字段
    )
    assert response.status_code == 400
    assert "detail" in response.json()
    assert response.json()["detail"] == "请求体不能为空"
 