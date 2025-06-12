import pytest
from app.models import AgentPrompt, ContentBlock

def test_agent_prompt_creation():
    """测试 AgentPrompt 模型创建"""
    prompt = AgentPrompt(prompt_text="测试提示词")
    assert prompt.prompt_text == "测试提示词"
    assert prompt.id is None  # 未保存到数据库前 id 为 None

def test_content_block_creation():
    """测试 ContentBlock 模型创建"""
    content = ContentBlock(
        prompt_id=1,
        content="测试内容",
        block_type="text"
    )
    assert content.prompt_id == 1
    assert content.content == "测试内容"
    assert content.block_type == "text"
    assert content.id is None

def test_agent_prompt_relationships(mock_db, mock_prompt, mock_content):
    """测试 AgentPrompt 和 ContentBlock 的关系"""
    # 设置 mock 返回值
    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_prompt, mock_content]
    
    # 验证关系
    prompt = mock_db.query(AgentPrompt).filter(AgentPrompt.id == 1).first()
    content = mock_db.query(ContentBlock).filter(ContentBlock.prompt_id == prompt.id).first()
    
    assert content is not None
    assert content.prompt_id == prompt.id 
 