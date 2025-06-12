import pytest
from fastapi import HTTPException
from unittest.mock import patch, MagicMock
from app.api.run_prompt import run_prompt
from app.models import AgentPrompt, ContentBlock

@pytest.fixture
def mock_db():
    """Mock数据库会话"""
    mock_session = MagicMock()
    mock_session.add = MagicMock()
    mock_session.commit = MagicMock()
    mock_session.refresh = MagicMock()
    mock_session.rollback = MagicMock()
    return mock_session

@pytest.fixture
def mock_get_db(mock_db):
    """Mock get_db函数"""
    with patch('app.api.run_prompt.get_db') as mock:
        mock.return_value = iter([mock_db])
        yield mock

@pytest.fixture
def mock_plan_task():
    """Mock plan_task函数"""
    with patch('app.api.run_prompt.plan_task') as mock:
        mock.return_value = {
            "task": "generate_content",
            "prompt": "test prompt",
            "content_type": "article"
        }
        yield mock

@pytest.fixture
def mock_write_content():
    """Mock write_content函数"""
    with patch('app.api.run_prompt.write_content') as mock:
        mock.return_value = {
            "title": "Test Title",
            "headings": ["Heading 1"],
            "paragraphs": ["Paragraph 1"],
            "faqs": []
        }
        yield mock

def test_run_prompt_success(mock_get_db, mock_plan_task, mock_write_content):
    """测试成功处理提示词请求"""
    payload = {"prompt": "test prompt"}
    response = run_prompt(payload)
    
    assert response["content_type"] == "structured"
    assert "id" in response
    assert "prompt_id" in response
    assert "content" in response
    assert "created_at" in response

def test_run_prompt_empty_payload():
    """测试空请求体"""
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({})
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "请求体不能为空"

def test_run_prompt_missing_prompt():
    """测试缺少提示词字段"""
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({"other": "value"})
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "提示词不能为空"

def test_run_prompt_invalid_prompt_type():
    """测试无效的提示词类型"""
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({"prompt": 123})
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "提示词必须是字符串类型"

def test_run_prompt_empty_prompt_text():
    """测试空提示词文本"""
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({"prompt": "   "})
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "提示词不能为空"

def test_run_prompt_text_content(mock_get_db, mock_plan_task, mock_write_content):
    """测试生成文本内容"""
    mock_write_content.return_value = "This is a text response"
    payload = {"prompt": "test prompt"}
    response = run_prompt(payload)
    
    assert response["content_type"] == "text"
    assert response["content"] == "This is a text response"

def test_run_prompt_db_error(mock_get_db, mock_plan_task, mock_write_content):
    """测试数据库错误处理"""
    mock_db = MagicMock()
    mock_db.add = MagicMock()
    mock_db.commit = MagicMock(side_effect=Exception("DB Error"))
    mock_db.rollback = MagicMock()
    mock_get_db.return_value = iter([mock_db])
    
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({"prompt": "test prompt"})
    assert exc_info.value.status_code == 500
    assert "服务器内部错误" in exc_info.value.detail

def test_run_prompt_plan_task_error(mock_get_db, mock_plan_task, mock_write_content):
    """测试任务规划错误处理"""
    mock_plan_task.side_effect = Exception("Plan Task Error")
    
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({"prompt": "test prompt"})
    assert exc_info.value.status_code == 500
    assert "服务器内部错误" in exc_info.value.detail

def test_run_prompt_write_content_error(mock_get_db, mock_plan_task, mock_write_content):
    """测试内容生成错误处理"""
    mock_write_content.side_effect = Exception("Write Content Error")
    
    with pytest.raises(HTTPException) as exc_info:
        run_prompt({"prompt": "test prompt"})
    assert exc_info.value.status_code == 500
    assert "服务器内部错误" in exc_info.value.detail 
 