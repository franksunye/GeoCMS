import pytest
from unittest.mock import patch

def test_write_content():
    """测试 write_content 函数"""
    with patch('app.api.run_prompt.write_content') as mock_write:
        mock_write.return_value = "模拟的 LLM 响应"
        result = mock_write("测试提示词")
        assert result == "模拟的 LLM 响应"
        mock_write.assert_called_once_with("测试提示词")

def test_llm_error_handling():
    """测试 LLM 错误处理"""
    with patch('app.api.run_prompt.write_content') as mock_write:
        mock_write.side_effect = Exception("LLM API 错误")
        with pytest.raises(Exception) as exc_info:
            mock_write("测试提示词")
        assert str(exc_info.value) == "LLM API 错误"

def test_llm_timeout():
    """测试 LLM 超时处理"""
    with patch('app.api.run_prompt.write_content') as mock_write:
        mock_write.side_effect = TimeoutError("请求超时")
        with pytest.raises(TimeoutError) as exc_info:
            mock_write("测试提示词")
        assert str(exc_info.value) == "请求超时" 