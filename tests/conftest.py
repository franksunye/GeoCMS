import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.db import get_db
from app.models import AgentPrompt, ContentBlock

@pytest.fixture
def mock_db():
    """Mock database session，自动分配 id"""
    mock_session = MagicMock()
    # 用于模拟自增 id
    _id_counter = {'prompt': 1, 'content': 1}
    def add_side_effect(obj):
        if isinstance(obj, AgentPrompt) and obj.id is None:
            obj.id = _id_counter['prompt']
            _id_counter['prompt'] += 1
        if isinstance(obj, ContentBlock) and obj.id is None:
            obj.id = _id_counter['content']
            _id_counter['content'] += 1
    mock_session.add.side_effect = add_side_effect
    mock_session.commit.side_effect = lambda: None
    mock_session.refresh.side_effect = lambda obj: None
    mock_session.query.return_value.filter.return_value.first.return_value = None
    return mock_session

@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response"""
    with patch('app.api.run_prompt.write_content', return_value="这是一个模拟的响应"):
        yield

@pytest.fixture
def client(mock_db):
    """Test client with mocked database"""
    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    # 清理依赖覆盖
    app.dependency_overrides.clear()

@pytest.fixture
def test_prompt():
    """Sample test prompt"""
    return "这是一个测试提示词"

@pytest.fixture
def mock_prompt():
    """Mock prompt object"""
    return AgentPrompt(id=1, prompt_text="这是一个测试提示词")

@pytest.fixture
def mock_content():
    """Mock content block"""
    return ContentBlock(id=1, prompt_id=1, content="这是一个模拟的响应", block_type="text")
