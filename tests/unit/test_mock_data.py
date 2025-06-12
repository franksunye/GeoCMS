"""
测试Mock数据生成器
"""
import pytest
from app.mock_data import MockDataGenerator, get_mock_content, get_mock_response

class TestMockDataGenerator:
    """测试Mock数据生成器类"""
    
    def setup_method(self):
        """设置测试环境"""
        self.generator = MockDataGenerator()
    
    def test_generate_ai_content(self):
        """测试AI相关内容生成"""
        prompt = "写一篇关于人工智能的文章"
        content = self.generator.generate_content(prompt)
        
        assert isinstance(content, dict)
        assert content["title"] == "人工智能技术概述"
        assert "headings" in content
        assert "paragraphs" in content
        assert "faqs" in content
        assert len(content["headings"]) > 0
        assert len(content["paragraphs"]) > 0
        assert len(content["faqs"]) > 0
    
    def test_generate_web_content(self):
        """测试Web开发相关内容生成"""
        prompt = "网站开发最佳实践"
        content = self.generator.generate_content(prompt)
        
        assert isinstance(content, dict)
        assert content["title"] == "网站开发最佳实践"
        assert "前端开发技术" in content["headings"]
    
    def test_generate_business_content(self):
        """测试商业相关内容生成"""
        prompt = "创业公司发展指南"
        content = self.generator.generate_content(prompt)
        
        assert isinstance(content, dict)
        assert content["title"] == "创业公司发展指南"
        assert "商业模式设计" in content["headings"]
    
    def test_generate_default_content(self):
        """测试默认内容生成"""
        prompt = "一些随机的提示词"
        content = self.generator.generate_content(prompt)
        
        assert isinstance(content, dict)
        assert "关于'一些随机的提示词...'" in content["title"]
        assert "headings" in content
        assert "paragraphs" in content
    
    def test_generate_simple_response(self):
        """测试简单文本响应生成"""
        prompt = "人工智能"
        response = self.generator.generate_simple_response(prompt)
        
        assert isinstance(response, str)
        assert "人工智能技术概述" in response
        assert "##" in response  # 包含标题标记
        assert "**" in response  # 包含FAQ问题标记
    
    def test_keyword_matching_ai(self):
        """测试AI关键词匹配"""
        test_cases = [
            "ai技术",
            "人工智能发展",
            "机器学习算法",
            "深度学习应用"
        ]
        
        for prompt in test_cases:
            content = self.generator.generate_content(prompt)
            assert content["title"] == "人工智能技术概述"
    
    def test_keyword_matching_web(self):
        """测试Web开发关键词匹配"""
        test_cases = [
            "网站建设",
            "web开发",
            "前端技术",
            "后端架构"
        ]
        
        for prompt in test_cases:
            content = self.generator.generate_content(prompt)
            assert content["title"] == "网站开发最佳实践"
    
    def test_keyword_matching_business(self):
        """测试商业关键词匹配"""
        test_cases = [
            "创业指南",
            "商业计划",
            "公司管理",
            "business plan"
        ]
        
        for prompt in test_cases:
            content = self.generator.generate_content(prompt)
            assert content["title"] == "创业公司发展指南"

def test_get_mock_content():
    """测试全局Mock内容获取函数"""
    content = get_mock_content("人工智能")
    assert isinstance(content, dict)
    assert "title" in content

def test_get_mock_response():
    """测试全局Mock响应获取函数"""
    response = get_mock_response("人工智能")
    assert isinstance(response, str)
    assert len(response) > 0
