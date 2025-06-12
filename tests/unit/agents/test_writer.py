"""
测试Writer Agent
"""
import pytest
from unittest.mock import patch, MagicMock
from app.agents.writer import write_content, generate_mock_content, build_enhanced_prompt

class TestWriterAgent:
    """测试Writer Agent功能"""
    
    def test_write_content_with_mock_data(self):
        """测试使用Mock数据生成内容"""
        task = {
            "prompt": "写一篇关于人工智能的文章",
            "content_type": "article",
            "structure": {"needs_title": True, "needs_paragraphs": True}
        }
        
        result = write_content(task)
        
        assert isinstance(result, dict)
        assert "title" in result
        assert "headings" in result
        assert "paragraphs" in result
        assert "faqs" in result
    
    def test_write_content_invalid_task(self):
        """测试无效任务处理"""
        result = write_content({})
        assert result == "Error: Invalid task"
        
        result = write_content(None)
        assert result == "Error: Invalid task"
    
    def test_write_content_missing_prompt(self):
        """测试缺少提示词的任务"""
        task = {"content_type": "article"}
        result = write_content(task)
        assert result == "Error: Invalid task"
    
    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    @patch('app.agents.writer.LANGCHAIN_AVAILABLE', True)
    @patch('app.agents.writer.generate_real_content')
    def test_write_content_with_real_llm(self, mock_generate_real):
        """测试使用真实LLM生成内容"""
        mock_generate_real.return_value = "Generated content"
        
        task = {
            "prompt": "test prompt",
            "content_type": "article"
        }
        
        result = write_content(task)
        assert result == "Generated content"
        mock_generate_real.assert_called_once_with(task)
    
    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    @patch('app.agents.writer.LANGCHAIN_AVAILABLE', True)
    @patch('app.agents.writer.generate_real_content')
    def test_write_content_llm_fallback(self, mock_generate_real):
        """测试LLM调用失败时的回退机制"""
        mock_generate_real.side_effect = Exception("LLM Error")
        
        task = {
            "prompt": "写一篇关于人工智能的文章",
            "content_type": "article"
        }
        
        result = write_content(task)
        
        # 应该回退到Mock数据
        assert isinstance(result, dict)
        assert "title" in result

class TestMockContentGeneration:
    """测试Mock内容生成"""
    
    def test_generate_mock_content(self):
        """测试Mock内容生成"""
        task = {
            "prompt": "人工智能技术",
            "content_type": "article"
        }
        
        result = generate_mock_content(task)
        
        assert isinstance(result, dict)
        assert "title" in result
        assert "headings" in result
        assert "paragraphs" in result
        assert "faqs" in result

class TestEnhancedPromptBuilding:
    """测试增强提示词构建"""
    
    def test_build_enhanced_prompt_basic(self):
        """测试基本增强提示词构建"""
        prompt_text = "写一篇文章"
        content_type = "article"
        structure = {
            "needs_title": True,
            "needs_headings": True,
            "needs_paragraphs": True,
            "needs_faqs": False,
            "needs_examples": False,
            "needs_steps": False
        }
        
        enhanced = build_enhanced_prompt(prompt_text, content_type, structure)
        
        assert isinstance(enhanced, str)
        assert prompt_text in enhanced
        assert content_type in enhanced
        assert "标题" in enhanced
        assert "章节标题" in enhanced
        assert "段落内容" in enhanced
    
    def test_build_enhanced_prompt_with_faqs(self):
        """测试包含FAQ的增强提示词"""
        prompt_text = "技术指南"
        content_type = "tutorial"
        structure = {
            "needs_title": True,
            "needs_headings": False,
            "needs_paragraphs": True,
            "needs_faqs": True,
            "needs_examples": False,
            "needs_steps": False
        }
        
        enhanced = build_enhanced_prompt(prompt_text, content_type, structure)
        
        assert "常见问题解答" in enhanced
        assert "章节标题" not in enhanced
