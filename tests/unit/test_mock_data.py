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
        test_cases = [
            "写一篇关于人工智能的文章",
            "AI技术发展",
            "机器学习应用",
            "深度学习简介"
        ]
        
        for prompt in test_cases:
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
        test_cases = [
            "网站开发最佳实践",
            "前端技术介绍",
            "后端架构设计",
            "web开发教程"
        ]
        
        for prompt in test_cases:
            content = self.generator.generate_content(prompt)
            assert isinstance(content, dict)
            assert content["title"] == "网站开发最佳实践"
            assert "前端开发技术" in content["headings"]
            assert "后端架构设计" in content["headings"]
    
    def test_generate_business_content(self):
        """测试商业相关内容生成"""
        test_cases = [
            "创业公司发展指南",
            "商业模式设计",
            "公司融资策略",
            "business plan"
        ]
        
        for prompt in test_cases:
            content = self.generator.generate_content(prompt)
            assert isinstance(content, dict)
            assert content["title"] == "创业公司发展指南"
            assert "商业模式设计" in content["headings"]
            assert "融资策略" in content["headings"]
    
    def test_generate_default_content(self):
        """测试默认内容生成"""
        test_cases = [
            "一些随机的提示词",
            "不相关的主题",
            "其他内容"
        ]
        
        for prompt in test_cases:
            content = self.generator.generate_content(prompt)
            assert isinstance(content, dict)
            assert "关于'" in content["title"]
            assert "..." in content["title"]
            assert "headings" in content
            assert "paragraphs" in content
            assert "faqs" in content
    
    def test_generate_simple_response(self):
        """测试简单文本响应生成"""
        test_cases = [
            "人工智能",
            "网站开发",
            "创业指南"
        ]
        
        for prompt in test_cases:
            response = self.generator.generate_simple_response(prompt)
            assert isinstance(response, str)
            assert "# " in response  # 包含标题标记
            assert "## " in response  # 包含章节标记
            assert "**" in response  # 包含FAQ问题标记
            assert len(response) > 0

def test_get_mock_content():
    """测试全局Mock内容获取函数"""
    test_cases = [
        "人工智能",
        "网站开发",
        "创业指南",
        "其他主题"
    ]
    
    for prompt in test_cases:
        content = get_mock_content(prompt)
        assert isinstance(content, dict)
        assert "title" in content
        assert "headings" in content
        assert "paragraphs" in content
        assert "faqs" in content

def test_get_mock_response():
    """测试全局Mock响应获取函数"""
    test_cases = [
        "人工智能",
        "网站开发",
        "创业指南",
        "其他主题"
    ]
    
    for prompt in test_cases:
        response = get_mock_response(prompt)
        assert isinstance(response, str)
        assert "# " in response
        assert "## " in response
        assert "**" in response
        assert len(response) > 0
