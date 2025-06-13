"""
Planner Agent - 负责分析用户提示词并制定内容生成计划
支持状态驱动的AI Native架构
"""
import re
import json
from typing import Dict, List, Any, Optional
from app.services.knowledge import infer_knowledge_needs, get_knowledge_service
from app.services.prompt_manager import get_prompt_manager, build_planner_prompt
from app.services.state_manager import get_state_manager, get_task_manager

# AI Native Planner Functions

def analyze_next_action(run_id: int, user_input: str, db_session) -> Dict[str, Any]:
    """
    AI Native: 分析下一步行动

    Args:
        run_id: 运行ID
        user_input: 用户输入
        db_session: 数据库会话

    Returns:
        下一步行动决策
    """
    try:
        state_manager = get_state_manager(db_session)

        # 获取当前状态
        current_state = state_manager.get_state(run_id)
        run = state_manager.get_run(run_id)

        if not run:
            return {"error": "Run not found"}

        # 检查是否有缺失的必要槽位
        missing_slots = state_manager.get_missing_slots(run_id)

        if missing_slots:
            # 需要询问槽位
            return _create_ask_slot_action(missing_slots[0], current_state, state_manager)
        else:
            # 可以开始规划任务
            return _create_plan_action(run.user_intent, current_state, db_session)

    except Exception as e:
        return {"error": f"Analysis failed: {str(e)}"}

def process_slot_input(run_id: int, slot_name: str, user_input: str, db_session) -> Dict[str, Any]:
    """
    处理槽位输入

    Args:
        run_id: 运行ID
        slot_name: 槽位名称
        user_input: 用户输入
        db_session: 数据库会话

    Returns:
        处理结果
    """
    try:
        state_manager = get_state_manager(db_session)
        task_manager = get_task_manager(db_session)

        # 更新槽位
        updated_state = state_manager.update_slot(run_id, slot_name, user_input)

        # 创建任务记录
        task_data = {
            "slot_name": slot_name,
            "user_input": user_input
        }
        task = task_manager.create_task(run_id, "ask_slot", task_data)
        task_manager.complete_task(task.id, {"slot_value": user_input})

        # 分析下一步行动
        return analyze_next_action(run_id, "", db_session)

    except Exception as e:
        return {"error": f"Slot processing failed: {str(e)}"}

def create_planner_run(user_intent: str, db_session) -> Dict[str, Any]:
    """
    创建新的规划运行

    Args:
        user_intent: 用户意图
        db_session: 数据库会话

    Returns:
        创建结果
    """
    try:
        state_manager = get_state_manager(db_session)

        # 创建运行
        run = state_manager.create_run(user_intent)

        # 分析下一步行动
        next_action = analyze_next_action(run.id, user_intent, db_session)

        return {
            "run_id": run.id,
            "status": "created",
            "next_action": next_action
        }

    except Exception as e:
        return {"error": f"Run creation failed: {str(e)}"}

def _create_ask_slot_action(slot_name: str, current_state: Dict[str, Any], state_manager) -> Dict[str, Any]:
    """
    创建询问槽位的行动

    Args:
        slot_name: 槽位名称
        current_state: 当前状态
        state_manager: 状态管理器

    Returns:
        询问槽位行动
    """
    prompt_manager = get_prompt_manager()
    slot_definitions = prompt_manager.get_slot_definitions("planner")

    slot_config = slot_definitions.get(slot_name, {})

    # 生成提示词
    prompt_text = _generate_slot_prompt(slot_name, slot_config)

    # 计算进度
    progress = _calculate_progress(current_state, slot_definitions)

    return {
        "action": "ask_slot",
        "slot_name": slot_name,
        "prompt": prompt_text,
        "options": slot_config.get("options", []),
        "current_state": current_state,
        "progress": progress
    }

def _create_plan_action(user_intent: str, current_state: Dict[str, Any], db_session) -> Dict[str, Any]:
    """
    创建规划行动

    Args:
        user_intent: 用户意图
        current_state: 当前状态
        db_session: 数据库会话

    Returns:
        规划行动
    """
    # 分析知识需求
    knowledge_analysis = analyze_knowledge_needs(user_intent, db_session)

    if knowledge_analysis.get("missing_knowledge"):
        return {
            "action": "missing_knowledge",
            "missing_knowledge": knowledge_analysis["missing_knowledge"],
            "available_knowledge": knowledge_analysis.get("available_knowledge", [])
        }

    # 生成任务计划
    tasks = _generate_content_tasks(current_state, knowledge_analysis.get("knowledge_context", {}))

    return {
        "action": "plan",
        "tasks": tasks,
        "knowledge_context": knowledge_analysis.get("knowledge_context", {}),
        "next_steps": [f"生成{task['page_type']}内容" for task in tasks]
    }

def _generate_slot_prompt(slot_name: str, slot_config: Dict[str, Any]) -> str:
    """
    生成槽位询问提示词

    Args:
        slot_name: 槽位名称
        slot_config: 槽位配置

    Returns:
        提示词文本
    """
    description = slot_config.get("description", slot_name)
    options = slot_config.get("options", [])

    if slot_name == "site_type":
        return "请告诉我您想创建什么类型的网站？"
    elif slot_name == "brand_name":
        return "请告诉我您的品牌或公司名称"
    elif slot_name == "target_audience":
        return "请描述您的目标用户群体"
    elif slot_name == "content_goals":
        return "请告诉我您希望通过网站实现什么目标？"
    else:
        prompt = f"请提供{description}"
        if options:
            prompt += f"，可选项包括：{', '.join(options)}"
        return prompt

def _calculate_progress(current_state: Dict[str, Any], slot_definitions: Dict[str, Any]) -> float:
    """
    计算进度百分比

    Args:
        current_state: 当前状态
        slot_definitions: 槽位定义

    Returns:
        进度百分比
    """
    required_slots = [name for name, config in slot_definitions.items()
                     if config.get("required", False)]

    if not required_slots:
        return 1.0

    filled_slots = sum(1 for slot in required_slots
                      if slot in current_state and current_state[slot] is not None)

    return filled_slots / len(required_slots)

def _generate_content_tasks(current_state: Dict[str, Any], knowledge_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    生成内容任务列表

    Args:
        current_state: 当前状态
        knowledge_context: 知识上下文

    Returns:
        任务列表
    """
    site_type = current_state.get("site_type", "")

    # 根据网站类型生成默认页面
    if "企业官网" in site_type:
        return [
            {
                "type": "generate_content",
                "page_type": "homepage",
                "knowledge_required": ["company_info", "brand_info"]
            },
            {
                "type": "generate_content",
                "page_type": "about",
                "knowledge_required": ["company_info"]
            }
        ]
    elif "产品介绍" in site_type:
        return [
            {
                "type": "generate_content",
                "page_type": "products",
                "knowledge_required": ["product_info", "brand_info"]
            }
        ]
    else:
        return [
            {
                "type": "generate_content",
                "page_type": "homepage",
                "knowledge_required": []
            }
        ]

# Legacy function for backward compatibility
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