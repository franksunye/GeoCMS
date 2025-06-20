"""
测试Planner Agent
"""
import pytest
from app.agents.planner import plan_task, analyze_content_structure, estimate_content_length

class TestPlannerAgent:
    """测试Planner Agent功能"""
    
    def test_plan_task_basic(self):
        """测试基本任务规划"""
        prompt = "写一篇关于Python编程的文章"
        result = plan_task(prompt)
        
        assert isinstance(result, dict)
        assert result["task"] == "generate_content"
        assert result["prompt"] == prompt
        assert "content_type" in result
        assert "structure" in result
        assert "length" in result
        assert "metadata" in result
    
    def test_plan_task_empty_prompt(self):
        """测试空提示词处理"""
        result = plan_task("")
        
        assert result["task"] == "error"
        assert "error" in result
    
    def test_plan_task_none_prompt(self):
        """测试None提示词处理"""
        result = plan_task(None)
        
        assert result["task"] == "error"
        assert "error" in result
    
    def test_plan_task_invalid_type(self):
        """测试无效类型提示词处理"""
        result = plan_task(123)
        
        assert result["task"] == "error"
        assert "error" in result
    
    def test_content_type_detection_article(self):
        """测试文章类型检测"""
        prompts = [
            "写一篇文章",
            "创建一个博客",
            "write an article",
            "create a blog post"
        ]
        
        for prompt in prompts:
            result = plan_task(prompt)
            assert result["content_type"] == "article"
    
    def test_content_type_detection_webpage(self):
        """测试网页类型检测"""
        prompts = [
            "创建一个网页",
            "设计页面",
            "build a website",
            "create a page"
        ]
        
        for prompt in prompts:
            result = plan_task(prompt)
            assert result["content_type"] == "webpage"

class TestContentStructureAnalysis:
    """测试内容结构分析"""
    
    def test_analyze_content_structure_basic(self):
        """测试基本结构分析"""
        prompt = "写一篇文章"
        structure = analyze_content_structure(prompt)
        
        assert isinstance(structure, dict)
        assert structure["needs_title"] is True
        assert structure["needs_paragraphs"] is True
        assert "needs_headings" in structure
        assert "needs_faqs" in structure
        assert "needs_examples" in structure
        assert "needs_steps" in structure
    
    def test_analyze_content_structure_long_prompt(self):
        """测试长提示词结构分析"""
        prompt = "写一篇详细的文章，包含多个章节和详细的内容说明" * 3
        structure = analyze_content_structure(prompt)
        
        assert structure["needs_headings"] is True
    
    def test_analyze_content_structure_faq(self):
        """测试FAQ需求检测"""
        prompts = [
            "包含常见问题",
            "添加FAQ",
            "解答疑问",
            "answer questions"
        ]
        
        for prompt in prompts:
            structure = analyze_content_structure(prompt)
            assert structure["needs_faqs"] is True

class TestContentLengthEstimation:
    """测试内容长度估算"""
    
    def test_estimate_content_length_long(self):
        """测试长内容估算"""
        prompts = [
            "详细介绍",
            "深入分析",
            "全面说明",
            "comprehensive guide",
            "detailed explanation"
        ]
        
        for prompt in prompts:
            length = estimate_content_length(prompt)
            assert length == "long"
    
    def test_estimate_content_length_short(self):
        """测试短内容估算"""
        prompts = [
            "简单介绍",
            "简短说明",
            "概要",
            "brief overview",
            "simple explanation"
        ]
        
        for prompt in prompts:
            length = estimate_content_length(prompt)
            assert length == "short"
    
    def test_estimate_content_length_medium(self):
        """测试中等内容估算"""
        prompt = "普通的内容请求"
        length = estimate_content_length(prompt)
        assert length == "medium"

def test_plan_task_invalid_input():
    """测试无效输入的处理"""
    # 测试 None 输入
    result = plan_task(None)
    assert result["task"] == "error"
    assert result["error"] == "Invalid prompt text"
    
    # 测试非字符串输入
    result = plan_task(123)
    assert result["task"] == "error"
    assert result["error"] == "Invalid prompt text"
    
    # 测试空字符串
    result = plan_task("")
    assert result["task"] == "error"
    assert result["error"] == "Invalid prompt text"

def test_plan_task_content_types():
    """测试不同类型内容的识别"""
    test_cases = [
        ("写一篇关于AI的文章", "article"),
        ("创建一个网站首页", "webpage"),
        ("Python入门教程", "tutorial"),
        ("产品功能介绍", "overview"),
        ("随便写点什么", "general")
    ]
    
    for prompt, expected_type in test_cases:
        result = plan_task(prompt)
        assert result["content_type"] == expected_type
        assert result["task"] == "generate_content"
        assert "structure" in result
        assert "length" in result
        assert "metadata" in result

def test_analyze_content_structure():
    """测试内容结构分析"""
    # 测试长文本
    long_prompt = "这是一个很长的提示词" * 10
    structure = analyze_content_structure(long_prompt)
    assert structure["needs_headings"] is True
    
    # 测试FAQ相关
    faq_prompt = "常见问题解答"
    structure = analyze_content_structure(faq_prompt)
    assert structure["needs_faqs"] is True
    
    # 测试示例相关
    example_prompt = "请给出一些例子"
    structure = analyze_content_structure(example_prompt)
    assert structure["needs_examples"] is True
    
    # 测试步骤相关
    steps_prompt = "操作步骤是什么"
    structure = analyze_content_structure(steps_prompt)
    assert structure["needs_steps"] is True

def test_estimate_content_length():
    """测试内容长度估算"""
    test_cases = [
        ("这是一个详细的分析", "long"),
        ("简单介绍一下", "short"),
        ("普通内容", "medium")
    ]
    
    for prompt, expected_length in test_cases:
        length = estimate_content_length(prompt)
        assert length == expected_length
