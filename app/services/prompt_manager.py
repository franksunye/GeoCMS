"""
System Prompt管理服务
"""
import json
import os
from typing import Dict, Any, Optional
from pathlib import Path

class PromptManager:
    """System Prompt管理器"""
    
    def __init__(self, prompts_dir: str = "prompts"):
        """
        初始化Prompt管理器
        
        Args:
            prompts_dir: prompts目录路径
        """
        self.prompts_dir = Path(prompts_dir)
        self._cache = {}
    
    def load_agent_prompt(self, agent_name: str) -> Dict[str, Any]:
        """
        加载Agent的系统提示词
        
        Args:
            agent_name: Agent名称 (planner/writer/verifier)
            
        Returns:
            Agent的系统提示词配置
        """
        cache_key = f"agent_{agent_name}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        prompt_file = self.prompts_dir / f"{agent_name}_agent.json"
        
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
        
        try:
            with open(prompt_file, 'r', encoding='utf-8') as f:
                prompt_config = json.load(f)
            
            self._cache[cache_key] = prompt_config
            return prompt_config
        
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in prompt file {prompt_file}: {e}")
        except Exception as e:
            raise RuntimeError(f"Error loading prompt file {prompt_file}: {e}")
    
    def get_system_prompt(self, agent_name: str) -> str:
        """
        获取Agent的系统提示词文本
        
        Args:
            agent_name: Agent名称
            
        Returns:
            系统提示词文本
        """
        config = self.load_agent_prompt(agent_name)
        return config.get("system_prompt", "")
    
    def get_slot_definitions(self, agent_name: str = "planner") -> Dict[str, Any]:
        """
        获取槽位定义
        
        Args:
            agent_name: Agent名称，默认为planner
            
        Returns:
            槽位定义字典
        """
        config = self.load_agent_prompt(agent_name)
        return config.get("slot_definitions", {})
    
    def get_knowledge_requirements(self, agent_name: str = "planner") -> Dict[str, Any]:
        """
        获取知识需求配置
        
        Args:
            agent_name: Agent名称，默认为planner
            
        Returns:
            知识需求配置
        """
        config = self.load_agent_prompt(agent_name)
        return config.get("knowledge_requirements", {})
    
    def get_response_template(self, agent_name: str, template_name: str) -> Dict[str, Any]:
        """
        获取响应模板
        
        Args:
            agent_name: Agent名称
            template_name: 模板名称
            
        Returns:
            响应模板
        """
        config = self.load_agent_prompt(agent_name)
        templates = config.get("response_templates", {})
        
        if template_name not in templates:
            raise ValueError(f"Template '{template_name}' not found for agent '{agent_name}'")
        
        return templates[template_name]
    
    def get_content_types(self, agent_name: str = "writer") -> Dict[str, Any]:
        """
        获取内容类型配置
        
        Args:
            agent_name: Agent名称，默认为writer
            
        Returns:
            内容类型配置
        """
        config = self.load_agent_prompt(agent_name)
        return config.get("content_types", {})
    
    def get_verification_criteria(self, agent_name: str = "verifier") -> Dict[str, Any]:
        """
        获取校验标准
        
        Args:
            agent_name: Agent名称，默认为verifier
            
        Returns:
            校验标准配置
        """
        config = self.load_agent_prompt(agent_name)
        return config.get("verification_criteria", {})
    
    def reload_prompts(self):
        """重新加载所有提示词（清除缓存）"""
        self._cache.clear()
    
    def validate_prompt_files(self) -> Dict[str, bool]:
        """
        验证所有提示词文件的有效性
        
        Returns:
            验证结果字典 {文件名: 是否有效}
        """
        results = {}
        agent_names = ["planner", "writer", "verifier"]
        
        for agent_name in agent_names:
            try:
                self.load_agent_prompt(agent_name)
                results[f"{agent_name}_agent.json"] = True
            except Exception as e:
                results[f"{agent_name}_agent.json"] = False
                print(f"Validation failed for {agent_name}: {e}")
        
        return results

# 全局实例
prompt_manager = PromptManager()

def get_prompt_manager() -> PromptManager:
    """获取全局Prompt管理器实例"""
    return prompt_manager

def build_planner_prompt(user_intent: str, current_state: Dict[str, Any], 
                        knowledge_context: Dict[str, Any] = None) -> str:
    """
    构建Planner Agent的完整提示词
    
    Args:
        user_intent: 用户意图
        current_state: 当前状态
        knowledge_context: 知识上下文
        
    Returns:
        完整的提示词
    """
    manager = get_prompt_manager()
    system_prompt = manager.get_system_prompt("planner")
    slot_definitions = manager.get_slot_definitions("planner")
    
    prompt = f"{system_prompt}\n\n"
    prompt += f"当前用户意图: {user_intent}\n"
    prompt += f"当前状态: {json.dumps(current_state, ensure_ascii=False)}\n"
    
    if knowledge_context:
        prompt += f"可用知识: {json.dumps(knowledge_context, ensure_ascii=False)}\n"
    
    prompt += f"\n槽位定义: {json.dumps(slot_definitions, ensure_ascii=False)}\n"
    prompt += "\n请分析当前状态并决定下一步行动。如果需要询问槽位，请返回ask_slot格式；如果可以开始规划，请返回plan格式。"
    
    return prompt

def build_writer_prompt(task_data: Dict[str, Any], knowledge_context: Dict[str, Any] = None) -> str:
    """
    构建Writer Agent的完整提示词
    
    Args:
        task_data: 任务数据
        knowledge_context: 知识上下文
        
    Returns:
        完整的提示词
    """
    manager = get_prompt_manager()
    system_prompt = manager.get_system_prompt("writer")
    content_types = manager.get_content_types("writer")
    
    prompt = f"{system_prompt}\n\n"
    prompt += f"任务信息: {json.dumps(task_data, ensure_ascii=False)}\n"
    
    if knowledge_context:
        prompt += f"知识上下文: {json.dumps(knowledge_context, ensure_ascii=False)}\n"
    
    page_type = task_data.get("page_type", "general")
    if page_type in content_types:
        prompt += f"\n内容类型配置: {json.dumps(content_types[page_type], ensure_ascii=False)}\n"
    
    prompt += "\n请根据以上信息生成高质量的结构化内容。"
    
    return prompt

def build_verifier_prompt(content: Dict[str, Any], knowledge_context: Dict[str, Any] = None) -> str:
    """
    构建Verifier Agent的完整提示词
    
    Args:
        content: 待校验的内容
        knowledge_context: 知识上下文
        
    Returns:
        完整的提示词
    """
    manager = get_prompt_manager()
    system_prompt = manager.get_system_prompt("verifier")
    criteria = manager.get_verification_criteria("verifier")
    
    prompt = f"{system_prompt}\n\n"
    prompt += f"待校验内容: {json.dumps(content, ensure_ascii=False)}\n"
    
    if knowledge_context:
        prompt += f"知识上下文: {json.dumps(knowledge_context, ensure_ascii=False)}\n"
    
    prompt += f"\n校验标准: {json.dumps(criteria, ensure_ascii=False)}\n"
    prompt += "\n请对内容进行全面校验并提供详细的评估结果和改进建议。"
    
    return prompt
