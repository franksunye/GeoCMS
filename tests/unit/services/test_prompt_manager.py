"""
测试Prompt管理服务
"""
import pytest
import json
import tempfile
import os
from pathlib import Path
from app.services.prompt_manager import PromptManager, get_prompt_manager, build_planner_prompt

class TestPromptManager:
    """测试PromptManager类"""
    
    @pytest.fixture
    def temp_prompts_dir(self):
        """创建临时prompts目录"""
        with tempfile.TemporaryDirectory() as temp_dir:
            prompts_dir = Path(temp_dir) / "prompts"
            prompts_dir.mkdir()
            
            # 创建测试用的prompt文件
            planner_config = {
                "system_prompt": "你是一个测试规划助手",
                "slot_definitions": {
                    "test_slot": {
                        "description": "测试槽位",
                        "required": True
                    }
                },
                "knowledge_requirements": {
                    "test_knowledge": {
                        "triggers": ["测试"],
                        "description": "测试知识"
                    }
                },
                "response_templates": {
                    "ask_slot": {
                        "action": "ask_slot",
                        "slot_name": "{slot_name}"
                    }
                }
            }
            
            writer_config = {
                "system_prompt": "你是一个测试写作助手",
                "content_types": {
                    "test_page": {
                        "description": "测试页面",
                        "structure": {
                            "title": "标题",
                            "content": "内容"
                        }
                    }
                }
            }
            
            verifier_config = {
                "system_prompt": "你是一个测试校验助手",
                "verification_criteria": {
                    "test_criteria": {
                        "description": "测试标准",
                        "weight": 1.0
                    }
                }
            }
            
            # 写入文件
            with open(prompts_dir / "planner_agent.json", 'w', encoding='utf-8') as f:
                json.dump(planner_config, f, ensure_ascii=False)
            
            with open(prompts_dir / "writer_agent.json", 'w', encoding='utf-8') as f:
                json.dump(writer_config, f, ensure_ascii=False)
            
            with open(prompts_dir / "verifier_agent.json", 'w', encoding='utf-8') as f:
                json.dump(verifier_config, f, ensure_ascii=False)
            
            yield str(prompts_dir)
    
    def test_load_agent_prompt(self, temp_prompts_dir):
        """测试加载Agent提示词"""
        manager = PromptManager(temp_prompts_dir)
        
        config = manager.load_agent_prompt("planner")
        
        assert config["system_prompt"] == "你是一个测试规划助手"
        assert "slot_definitions" in config
        assert "test_slot" in config["slot_definitions"]
    
    def test_load_nonexistent_prompt(self, temp_prompts_dir):
        """测试加载不存在的提示词文件"""
        manager = PromptManager(temp_prompts_dir)
        
        with pytest.raises(FileNotFoundError):
            manager.load_agent_prompt("nonexistent")
    
    def test_get_system_prompt(self, temp_prompts_dir):
        """测试获取系统提示词"""
        manager = PromptManager(temp_prompts_dir)
        
        prompt = manager.get_system_prompt("planner")
        
        assert prompt == "你是一个测试规划助手"
    
    def test_get_slot_definitions(self, temp_prompts_dir):
        """测试获取槽位定义"""
        manager = PromptManager(temp_prompts_dir)
        
        slots = manager.get_slot_definitions("planner")
        
        assert "test_slot" in slots
        assert slots["test_slot"]["description"] == "测试槽位"
        assert slots["test_slot"]["required"] is True
    
    def test_get_knowledge_requirements(self, temp_prompts_dir):
        """测试获取知识需求"""
        manager = PromptManager(temp_prompts_dir)
        
        requirements = manager.get_knowledge_requirements("planner")
        
        assert "test_knowledge" in requirements
        assert requirements["test_knowledge"]["description"] == "测试知识"
    
    def test_get_response_template(self, temp_prompts_dir):
        """测试获取响应模板"""
        manager = PromptManager(temp_prompts_dir)
        
        template = manager.get_response_template("planner", "ask_slot")
        
        assert template["action"] == "ask_slot"
        assert template["slot_name"] == "{slot_name}"
    
    def test_get_nonexistent_template(self, temp_prompts_dir):
        """测试获取不存在的模板"""
        manager = PromptManager(temp_prompts_dir)
        
        with pytest.raises(ValueError):
            manager.get_response_template("planner", "nonexistent")
    
    def test_get_content_types(self, temp_prompts_dir):
        """测试获取内容类型"""
        manager = PromptManager(temp_prompts_dir)
        
        content_types = manager.get_content_types("writer")
        
        assert "test_page" in content_types
        assert content_types["test_page"]["description"] == "测试页面"
    
    def test_get_verification_criteria(self, temp_prompts_dir):
        """测试获取校验标准"""
        manager = PromptManager(temp_prompts_dir)
        
        criteria = manager.get_verification_criteria("verifier")
        
        assert "test_criteria" in criteria
        assert criteria["test_criteria"]["weight"] == 1.0
    
    def test_cache_functionality(self, temp_prompts_dir):
        """测试缓存功能"""
        manager = PromptManager(temp_prompts_dir)
        
        # 第一次加载
        config1 = manager.load_agent_prompt("planner")
        
        # 第二次加载（应该从缓存获取）
        config2 = manager.load_agent_prompt("planner")
        
        assert config1 is config2  # 应该是同一个对象
    
    def test_reload_prompts(self, temp_prompts_dir):
        """测试重新加载提示词"""
        manager = PromptManager(temp_prompts_dir)
        
        # 加载一次
        manager.load_agent_prompt("planner")
        assert len(manager._cache) > 0
        
        # 重新加载
        manager.reload_prompts()
        assert len(manager._cache) == 0
    
    def test_validate_prompt_files(self, temp_prompts_dir):
        """测试验证提示词文件"""
        manager = PromptManager(temp_prompts_dir)
        
        results = manager.validate_prompt_files()
        
        assert results["planner_agent.json"] is True
        assert results["writer_agent.json"] is True
        assert results["verifier_agent.json"] is True

class TestPromptBuilders:
    """测试提示词构建函数"""
    
    @pytest.fixture
    def temp_prompts_dir(self):
        """创建临时prompts目录"""
        with tempfile.TemporaryDirectory() as temp_dir:
            prompts_dir = Path(temp_dir) / "prompts"
            prompts_dir.mkdir()
            
            # 创建简单的配置文件
            planner_config = {
                "system_prompt": "你是规划助手",
                "slot_definitions": {"test": "测试"}
            }
            
            with open(prompts_dir / "planner_agent.json", 'w', encoding='utf-8') as f:
                json.dump(planner_config, f)
            
            yield str(prompts_dir)
    
    def test_build_planner_prompt(self, temp_prompts_dir):
        """测试构建Planner提示词"""
        # 临时替换全局管理器
        original_manager = get_prompt_manager()
        temp_manager = PromptManager(temp_prompts_dir)
        
        # 模拟替换（在实际应用中可能需要更好的依赖注入）
        import app.services.prompt_manager
        app.services.prompt_manager.prompt_manager = temp_manager
        
        try:
            user_intent = "创建网站"
            current_state = {"site_type": "企业官网"}
            knowledge_context = {"company_info": {"name": "测试公司"}}
            
            prompt = build_planner_prompt(user_intent, current_state, knowledge_context)
            
            assert "你是规划助手" in prompt
            assert "创建网站" in prompt
            assert "企业官网" in prompt
            assert "测试公司" in prompt
        
        finally:
            # 恢复原始管理器
            app.services.prompt_manager.prompt_manager = original_manager

class TestGlobalPromptManager:
    """测试全局Prompt管理器"""
    
    def test_get_prompt_manager(self):
        """测试获取全局管理器"""
        manager = get_prompt_manager()
        
        assert isinstance(manager, PromptManager)
        assert manager is get_prompt_manager()  # 应该是单例

class TestPromptManagerErrorHandling:
    """测试错误处理"""
    
    def test_invalid_json_file(self):
        """测试无效JSON文件"""
        with tempfile.TemporaryDirectory() as temp_dir:
            prompts_dir = Path(temp_dir) / "prompts"
            prompts_dir.mkdir()
            
            # 创建无效JSON文件
            with open(prompts_dir / "planner_agent.json", 'w') as f:
                f.write("invalid json content")
            
            manager = PromptManager(str(prompts_dir))
            
            with pytest.raises(ValueError):
                manager.load_agent_prompt("planner")
    
    def test_missing_prompts_directory(self):
        """测试缺失prompts目录"""
        with tempfile.TemporaryDirectory() as temp_dir:
            nonexistent_dir = Path(temp_dir) / "nonexistent"
            manager = PromptManager(str(nonexistent_dir))
            
            with pytest.raises(FileNotFoundError):
                manager.load_agent_prompt("planner")
