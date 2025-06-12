"""
Writer Agent - 负责根据计划生成结构化内容
"""
import os
import json
from typing import Dict, Any, Union
from app.mock_data import get_mock_content, get_mock_response

# 尝试导入LangChain，如果失败则使用Mock数据
try:
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
    from langchain_openai import OpenAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

def write_content(task: Dict[str, Any]) -> Union[str, Dict[str, Any]]:
    """
    根据任务计划生成内容

    Args:
        task: 来自planner的任务计划

    Returns:
        生成的内容（字符串或结构化数据）
    """
    if not task or "prompt" not in task:
        return "Error: Invalid task"

    prompt_text = task["prompt"]

    # 检查是否有OpenAI API密钥
    if not os.getenv("OPENAI_API_KEY") or not LANGCHAIN_AVAILABLE:
        # 使用Mock数据
        return generate_mock_content(task)

    try:
        # 尝试使用真实的LLM
        return generate_real_content(task)
    except Exception as e:
        print(f"LLM调用失败，使用Mock数据: {e}")
        return generate_mock_content(task)

def generate_mock_content(task: Dict[str, Any]) -> Dict[str, Any]:
    """
    使用Mock数据生成内容

    Args:
        task: 任务计划

    Returns:
        结构化的Mock内容
    """
    prompt_text = task["prompt"]
    return get_mock_content(prompt_text)

def generate_real_content(task: Dict[str, Any]) -> str:
    """
    使用真实的LLM生成内容

    Args:
        task: 任务计划

    Returns:
        LLM生成的内容
    """
    prompt_text = task["prompt"]
    content_type = task.get("content_type", "general")
    structure = task.get("structure", {})

    # 构建更详细的提示词
    enhanced_prompt = build_enhanced_prompt(prompt_text, content_type, structure)

    # 初始化LLM
    llm = OpenAI(temperature=0.7, max_tokens=2000)

    # 创建提示模板
    template = PromptTemplate(
        input_variables=["enhanced_prompt"],
        template="{enhanced_prompt}"
    )

    # 创建链
    chain = LLMChain(llm=llm, prompt=template)

    # 生成内容
    result = chain.run({"enhanced_prompt": enhanced_prompt})

    return result

def build_enhanced_prompt(prompt_text: str, content_type: str, structure: Dict[str, bool]) -> str:
    """
    构建增强的提示词

    Args:
        prompt_text: 原始提示词
        content_type: 内容类型
        structure: 内容结构需求

    Returns:
        增强的提示词
    """
    enhanced_prompt = f"请根据以下要求生成内容：\n\n"
    enhanced_prompt += f"主题：{prompt_text}\n"
    enhanced_prompt += f"内容类型：{content_type}\n\n"

    enhanced_prompt += "请按照以下结构生成内容：\n"

    if structure.get("needs_title", True):
        enhanced_prompt += "1. 一个吸引人的标题\n"

    if structure.get("needs_headings", False):
        enhanced_prompt += "2. 3-5个主要章节标题\n"

    if structure.get("needs_paragraphs", True):
        enhanced_prompt += "3. 每个章节包含详细的段落内容\n"

    if structure.get("needs_faqs", False):
        enhanced_prompt += "4. 常见问题解答部分\n"

    if structure.get("needs_examples", False):
        enhanced_prompt += "5. 相关示例或案例\n"

    if structure.get("needs_steps", False):
        enhanced_prompt += "6. 具体的操作步骤\n"

    enhanced_prompt += "\n请确保内容准确、有用且易于理解。"

    return enhanced_prompt