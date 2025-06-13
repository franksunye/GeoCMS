#!/usr/bin/env python3
"""
AI Native 配置驱动架构演示

展示如何通过修改JSON配置来改变系统行为，而无需修改代码。
这是AI Native架构的核心特性之一：配置即代码，提示即逻辑。

使用方法：
1. 确保后端服务正在运行 (uvicorn app.main:app --reload)
2. 运行此脚本: python docs/examples/config_driven_demo.py

演示内容：
- 最小化配置：只收集2个必需槽位
- 扩展配置：收集7个详细槽位
- 自动恢复原始配置
"""
import json
import shutil
import requests
from pathlib import Path

def backup_config():
    """备份原始配置"""
    original = Path("prompts/planner_agent.json")
    backup = Path("prompts/planner_agent.json.backup")
    shutil.copy2(original, backup)
    print("✅ 已备份原始配置")

def restore_config():
    """恢复原始配置"""
    backup = Path("prompts/planner_agent.json.backup")
    original = Path("prompts/planner_agent.json")
    if backup.exists():
        shutil.copy2(backup, original)
        backup.unlink()
        print("✅ 已恢复原始配置")

def create_minimal_config():
    """创建最小化配置 - 只收集2个必需槽位"""
    config = {
        "system_prompt": "你是一个智能内容规划助手，专门帮助用户创建网站内容。",
        "decision_logic": {
            "ask_slot": "当缺少必要信息时，询问用户补充。",
            "plan": "当信息充足时，制定内容生成计划。"
        },
        "slot_definitions": {
            "site_type": {
                "description": "网站类型",
                "prompt": "请告诉我您想创建什么类型的网站？",
                "options": ["企业官网", "产品介绍", "个人博客"],
                "required": True,
                "priority": 1
            },
            "brand_name": {
                "description": "品牌名称",
                "prompt": "请告诉我您的品牌名称",
                "required": True,
                "priority": 2
            }
        },
        "knowledge_requirements": {
            "company_info": {
                "description": "公司基本信息",
                "required_for": ["企业官网"]
            }
        },
        "task_generation_rules": {
            "企业官网": [
                {
                    "type": "generate_content",
                    "page_type": "homepage",
                    "knowledge_required": ["company_info"]
                }
            ],
            "产品介绍": [
                {
                    "type": "generate_content",
                    "page_type": "products",
                    "knowledge_required": []
                }
            ],
            "个人博客": [
                {
                    "type": "generate_content",
                    "page_type": "homepage",
                    "knowledge_required": []
                }
            ]
        },
        "response_templates": {
            "ask_slot": {
                "action": "ask_slot",
                "slot_name": "{slot_name}",
                "prompt": "{prompt_text}",
                "options": "{options}",
                "current_state": "{state}",
                "progress": "{progress}"
            },
            "plan": {
                "action": "plan",
                "tasks": "{tasks}",
                "knowledge_context": "{knowledge_context}",
                "next_steps": "{next_steps}"
            }
        }
    }
    
    with open("prompts/planner_agent.json", "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    print("✅ 已创建最小化配置（只收集2个槽位）")

def reload_config():
    """重新加载配置"""
    try:
        response = requests.post("http://localhost:8000/api/ai-native/reload-config")
        if response.status_code == 200:
            print("✅ 配置缓存已清除")
            return True
    except:
        print("⚠️  无法清除配置缓存，可能需要重启服务")
        return False

def test_config(config_name: str):
    """测试指定配置"""
    print(f"\n🧪 测试 {config_name} 配置...")
    
    # 清除缓存以确保使用新配置
    reload_config()
    
    try:
        # 开始对话
        response = requests.post(
            "http://localhost:8000/api/ai-native/conversations",
            json={"user_intent": "我想创建一个企业官网"}
        )
        
        if response.status_code != 200:
            print(f"❌ 测试失败: {response.status_code}")
            return
        
        data = response.json()
        run_id = data["run_id"]
        
        # 计算需要填充的槽位数量
        slot_count = 0
        current_action = data["next_action"]
        
        while current_action.get("action") == "ask_slot":
            slot_count += 1
            slot_name = current_action["slot_name"]
            print(f"  槽位 {slot_count}: {slot_name} - {current_action.get('prompt')}")
            
            # 模拟填充槽位
            test_values = {
                "site_type": "企业官网",
                "brand_name": "测试公司",
                "target_audience": "企业客户",
                "content_goals": "品牌展示",
                "pages": "homepage",
                "style_preference": "现代简约",
                "color_scheme": "蓝色系"
            }
            
            value = test_values.get(slot_name, "测试值")
            
            response = requests.post(
                f"http://localhost:8000/api/ai-native/conversations/{run_id}/input",
                json={"user_input": value, "context": {"slot_name": slot_name}}
            )
            
            if response.status_code != 200:
                print(f"❌ 填充槽位失败: {response.status_code}")
                break
            
            result = response.json()
            current_action = result.get("data", {})
        
        print(f"✅ {config_name} 配置测试完成，共收集了 {slot_count} 个槽位")
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务，请确保后端服务正在运行")
        print("   启动命令: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    print("🚀 AI Native 配置驱动架构演示")
    print("=" * 50)
    print("展示如何通过修改JSON配置来改变系统行为，而无需修改代码")
    print()
    
    # 备份原始配置
    backup_config()
    
    try:
        # 测试最小化配置
        create_minimal_config()
        test_config("最小化")
        
    finally:
        # 恢复原始配置
        restore_config()
    
    print("\n🎉 演示完成！")
    print("\n💡 AI Native 配置驱动架构的优势：")
    print("- 🔧 控制收集多少个槽位")
    print("- 📝 自定义每个槽位的提示词")
    print("- ⚙️  配置任务生成规则")
    print("- 🧠 定义知识需求")
    print("- 🚀 无需修改任何代码！")
    print("- 🔄 支持热重载配置")
    print("\n📖 更多信息请查看: docs/00_AI_NATIVE_DESIGN.md")
