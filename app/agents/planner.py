"""
Planner Agent - 负责分析用户提示词并制定内容生成计划
"""
import re
from typing import Dict, List, Any, Optional
from app.services.knowledge import infer_knowledge_needs, get_knowledge_service

def plan_task(prompt_text: str, db_session=None) -> Dict[str, Any]:
    """
    分析用户提示词并制定内容生成计划

    Args:
        prompt_text: 用户输入的提示词
        db_session: 数据库会话（可选）

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

    # 分析知识需求
    knowledge_analysis = analyze_knowledge_needs(prompt_text, db_session)

    # 如果缺少必要知识，返回缺失信息
    if knowledge_analysis.get("missing_knowledge"):
        return {
            "task": "missing_knowledge",
            "prompt": prompt_text,
            "missing_knowledge": knowledge_analysis["missing_knowledge"],
            "available_knowledge": knowledge_analysis.get("available_knowledge", [])
        }

    return {
        "task": "generate_content",
        "prompt": prompt_text,
        "content_type": content_type,
        "structure": structure,
        "length": length,
        "knowledge_context": knowledge_analysis.get("knowledge_context", {}),
        "metadata": {
            "analyzed_at": "now",
            "confidence": 0.8,
            "knowledge_used": knowledge_analysis.get("knowledge_used", [])
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

def analyze_knowledge_needs(prompt_text: str, db_session=None) -> Dict[str, Any]:
    """
    分析提示词的知识需求

    Args:
        prompt_text: 用户输入的提示词
        db_session: 数据库会话（可选）

    Returns:
        知识分析结果
    """
    # 推断所需的知识类型
    needed_knowledge_types = infer_knowledge_needs(prompt_text)

    if not needed_knowledge_types:
        # 如果不需要特定知识，返回空结果
        return {
            "knowledge_context": {},
            "knowledge_used": [],
            "missing_knowledge": []
        }

    # 如果没有数据库会话，返回缺失知识
    if db_session is None:
        return {
            "missing_knowledge": [
                {
                    "topic": knowledge_type,
                    "description": get_knowledge_description(knowledge_type),
                    "suggested_fields": get_knowledge_template_fields(knowledge_type)
                }
                for knowledge_type in needed_knowledge_types
            ],
            "available_knowledge": [],
            "knowledge_context": {}
        }

    # 查询知识库
    try:
        knowledge_service = get_knowledge_service(db_session)
        available_knowledge = []
        missing_knowledge = []
        knowledge_context = {}

        for knowledge_type in needed_knowledge_types:
            knowledge = knowledge_service.get_knowledge_by_topic(knowledge_type)
            if knowledge:
                available_knowledge.append(knowledge_type)
                knowledge_context[knowledge_type] = knowledge_service.get_knowledge_content(knowledge)
            else:
                missing_knowledge.append({
                    "topic": knowledge_type,
                    "description": get_knowledge_description(knowledge_type),
                    "suggested_fields": get_knowledge_template_fields(knowledge_type)
                })

        return {
            "knowledge_context": knowledge_context,
            "knowledge_used": available_knowledge,
            "missing_knowledge": missing_knowledge,
            "available_knowledge": available_knowledge
        }

    except Exception as e:
        # 如果查询失败，返回缺失知识
        return {
            "missing_knowledge": [
                {
                    "topic": knowledge_type,
                    "description": get_knowledge_description(knowledge_type),
                    "suggested_fields": get_knowledge_template_fields(knowledge_type)
                }
                for knowledge_type in needed_knowledge_types
            ],
            "available_knowledge": [],
            "knowledge_context": {},
            "error": str(e)
        }

def get_knowledge_description(knowledge_type: str) -> str:
    """
    获取知识类型的描述

    Args:
        knowledge_type: 知识类型

    Returns:
        知识类型描述
    """
    descriptions = {
        "company_info": "公司基本信息，包括名称、简介、使命等",
        "product_info": "产品信息，包括名称、特性、优势等",
        "brand_info": "品牌信息，包括名称、口号、价值观等",
        "service_info": "服务信息，包括名称、流程、优势等"
    }
    return descriptions.get(knowledge_type, f"{knowledge_type} 相关信息")

def get_knowledge_template_fields(knowledge_type: str) -> List[str]:
    """
    获取知识类型的建议字段

    Args:
        knowledge_type: 知识类型

    Returns:
        建议字段列表
    """
    from app.services.knowledge import get_knowledge_template
    template = get_knowledge_template(knowledge_type)
    return list(template.keys()) if template else []