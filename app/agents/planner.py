"""
Planner Agent - 负责分析用户提示词并制定内容生成计划
"""
import re
from typing import Dict, List, Any

def plan_task(prompt_text: str) -> Dict[str, Any]:
    """
    分析用户提示词并制定内容生成计划

    Args:
        prompt_text: 用户输入的提示词

    Returns:
        包含任务类型和详细计划的字典
    """
    if not prompt_text or not isinstance(prompt_text, str):
        return {
            "task": "error",
            "prompt": prompt_text,
            "error": "Invalid prompt text"
        }

    # 分析提示词内容
    prompt_lower = prompt_text.lower()

    # 确定内容类型
    content_type = "general"
    if any(keyword in prompt_lower for keyword in ["文章", "博客", "blog", "article"]):
        content_type = "article"
    elif any(keyword in prompt_lower for keyword in ["网页", "页面", "网站", "website", "page", "首页"]):
        content_type = "webpage"
    elif any(keyword in prompt_lower for keyword in ["教程", "指南", "tutorial", "guide"]):
        content_type = "tutorial"
    elif any(keyword in prompt_lower for keyword in ["介绍", "概述", "overview", "introduction"]):
        content_type = "overview"

    # 分析所需的内容结构
    structure = analyze_content_structure(prompt_text)

    # 估算内容长度
    length = estimate_content_length(prompt_text)

    return {
        "task": "generate_content",
        "prompt": prompt_text,
        "content_type": content_type,
        "structure": structure,
        "length": length,
        "metadata": {
            "analyzed_at": "now",
            "confidence": 0.8
        }
    }

def analyze_content_structure(prompt_text: str) -> Dict[str, bool]:
    """
    分析提示词以确定需要的内容结构

    Args:
        prompt_text: 用户输入的提示词

    Returns:
        包含各种内容结构需求的字典
    """
    prompt_lower = prompt_text.lower()

    return {
        "needs_title": True,  # 总是需要标题
        "needs_headings": len(prompt_text) > 50,  # 长提示词需要多个标题
        "needs_paragraphs": True,  # 总是需要段落
        "needs_faqs": any(keyword in prompt_lower for keyword in ["问题", "faq", "疑问", "解答", "常见问题", "questions"]),
        "needs_examples": any(keyword in prompt_lower for keyword in ["例子", "示例", "example", "案例"]),
        "needs_steps": any(keyword in prompt_lower for keyword in ["步骤", "流程", "step", "过程"])
    }

def estimate_content_length(prompt_text: str) -> str:
    """
    根据提示词估算内容长度

    Args:
        prompt_text: 用户输入的提示词

    Returns:
        内容长度估算 ("short", "medium", "long")
    """
    prompt_lower = prompt_text.lower()

    if any(keyword in prompt_lower for keyword in ["详细", "深入", "全面", "comprehensive", "detailed"]):
        return "long"
    elif any(keyword in prompt_lower for keyword in ["简单", "简短", "概要", "brief", "simple"]):
        return "short"
    else:
        return "medium"