import os
import pytest
from app.agents.planner import plan_task
from app.agents.writer import write_content

# 测试 Planner 代理
def test_planner():
    """测试 Planner 代理是否正确处理任务"""
    test_prompt = "写一篇关于人工智能的文章"
    result = plan_task(test_prompt)
    
    # 验证返回结果的结构
    assert isinstance(result, dict)
    assert "task" in result
    assert "prompt" in result
    assert result["prompt"] == test_prompt

# 测试 Writer 代理
# 注意：这个测试会实际调用 OpenAI API，需要设置正确的 API 密钥
@pytest.mark.skipif(
    not os.environ.get("OPENAI_API_KEY"),
    reason="需要设置 OPENAI_API_KEY 环境变量"
)
def test_writer():
    """测试 Writer 代理是否能生成内容"""
    test_task = {
        "task": "generate_page",
        "prompt": "写一段关于人工智能的简短介绍"
    }
    result = write_content(test_task)
    
    # 验证返回结果不为空
    assert isinstance(result, str)
    assert len(result) > 0

# 测试错误处理
def test_planner_with_empty_prompt():
    """测试 Planner 处理空提示词的情况"""
    result = plan_task("")
    assert isinstance(result, dict)
    assert "task" in result
    assert "prompt" in result
    assert result["prompt"] == ""
