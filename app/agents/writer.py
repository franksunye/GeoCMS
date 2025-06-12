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
    knowledge_context = task.get("knowledge_context", {})

    # 获取基础 Mock 内容
    mock_content = get_mock_content(prompt_text)

    # 如果有知识上下文，增强内容
    if knowledge_context:
        mock_content = enhance_content_with_knowledge(mock_content, knowledge_context)

    return mock_content

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
    knowledge_context = task.get("knowledge_context", {})

    # 构建更详细的提示词
    enhanced_prompt = build_enhanced_prompt(prompt_text, content_type, structure, knowledge_context)

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

def build_enhanced_prompt(prompt_text: str, content_type: str, structure: Dict[str, bool], knowledge_context: Dict[str, Any] = None) -> str:
    """
    构建增强的提示词

    Args:
        prompt_text: 原始提示词
        content_type: 内容类型
        structure: 内容结构需求
        knowledge_context: 知识上下文

    Returns:
        增强的提示词
    """
    enhanced_prompt = f"请根据以下要求生成内容：\n\n"
    enhanced_prompt += f"主题：{prompt_text}\n"
    enhanced_prompt += f"内容类型：{content_type}\n\n"

    # 添加知识上下文
    if knowledge_context:
        enhanced_prompt += "相关背景信息：\n"
        for topic, content in knowledge_context.items():
            enhanced_prompt += f"- {topic}: {json.dumps(content, ensure_ascii=False)}\n"
        enhanced_prompt += "\n"

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

    enhanced_prompt += "\n请确保内容准确、有用且易于理解，并充分利用提供的背景信息。"

    return enhanced_prompt

def enhance_content_with_knowledge(content: Dict[str, Any], knowledge_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    使用知识上下文增强内容

    Args:
        content: 原始内容
        knowledge_context: 知识上下文

    Returns:
        增强后的内容
    """
    enhanced_content = content.copy()

    # 增强标题
    if "title" in enhanced_content and knowledge_context:
        for topic, knowledge in knowledge_context.items():
            if topic == "company_info" and "name" in knowledge:
                enhanced_content["title"] = f"{knowledge['name']} - {enhanced_content['title']}"
                break
            elif topic == "product_info" and "name" in knowledge:
                enhanced_content["title"] = f"{knowledge['name']} - {enhanced_content['title']}"
                break

    # 增强段落内容
    if "paragraphs" in enhanced_content and knowledge_context:
        enhanced_paragraphs = []
        for paragraph in enhanced_content["paragraphs"]:
            enhanced_paragraph = paragraph

            # 注入公司信息
            if "company_info" in knowledge_context:
                company_info = knowledge_context["company_info"]
                if "name" in company_info:
                    enhanced_paragraph = enhanced_paragraph.replace("我们的公司", company_info["name"])
                    enhanced_paragraph = enhanced_paragraph.replace("本公司", company_info["name"])

            # 注入产品信息
            if "product_info" in knowledge_context:
                product_info = knowledge_context["product_info"]
                if "name" in product_info:
                    enhanced_paragraph = enhanced_paragraph.replace("我们的产品", product_info["name"])
                    enhanced_paragraph = enhanced_paragraph.replace("该产品", product_info["name"])

            enhanced_paragraphs.append(enhanced_paragraph)

        enhanced_content["paragraphs"] = enhanced_paragraphs

    # 添加知识来源标记
    enhanced_content["knowledge_sources"] = list(knowledge_context.keys())

    return enhanced_content