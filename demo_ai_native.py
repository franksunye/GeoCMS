#!/usr/bin/env python3
"""
GeoCMS AI Native 功能演示脚本

这个脚本演示了AI Native多Agent系统的核心功能：
1. 状态驱动的多轮对话
2. 动态槽位询问
3. Agent协同工作流
4. 知识感知内容生成

使用方法：
1. 启动API服务：uvicorn app.main:app --reload
2. 运行演示：python demo_ai_native.py
"""

import requests
import json
import time
from typing import Dict, Any

# 配置
API_BASE_URL = "http://localhost:8000"
DEMO_USER_INTENT = "我想创建一个AI科技公司的企业官网，展示我们的智能建站产品"

def print_header(title: str):
    """打印标题"""
    print("\n" + "="*60)
    print(f"🚀 {title}")
    print("="*60)

def print_step(step: str, content: str):
    """打印步骤"""
    print(f"\n📋 {step}")
    print("-" * 40)
    print(content)

def print_response(response: Dict[str, Any]):
    """打印API响应"""
    print(json.dumps(response, indent=2, ensure_ascii=False))

def check_api_health():
    """检查API服务状态"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/ai-native/health", timeout=5)
        if response.status_code == 200:
            print("✅ API服务正常运行")
            return True
        else:
            print(f"❌ API服务异常: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务")
        print("请确保API服务正在运行：uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ 检查API服务时出错: {e}")
        return False

def demo_ai_native_conversation():
    """演示AI Native对话功能"""
    print_header("AI Native 多轮对话演示")
    
    # 1. 开始对话
    print_step("步骤 1", "开始AI Native对话")
    
    conversation_data = {"user_intent": DEMO_USER_INTENT}
    print(f"用户意图: {DEMO_USER_INTENT}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ 开始对话失败: {response.status_code}")
            return None
        
        start_result = response.json()
        print("✅ 对话开始成功")
        print_response(start_result)
        
        run_id = start_result["run_id"]
        next_action = start_result["next_action"]
        
        # 2. 模拟多轮对话
        print_step("步骤 2", "模拟多轮槽位填充")
        
        # 预定义的回答
        slot_answers = {
            "site_type": "企业官网",
            "brand_name": "GeoCMS AI科技",
            "target_audience": "中小企业主",
            "content_goals": "品牌展示"
        }
        
        conversation_round = 1
        max_rounds = 5
        
        while (next_action.get("action") == "ask_slot" and 
               conversation_round <= max_rounds):
            
            slot_name = next_action.get("slot_name")
            prompt = next_action.get("prompt")
            
            print(f"\n🤖 AI助手 (第{conversation_round}轮): {prompt}")
            
            # 获取预定义答案
            user_answer = slot_answers.get(slot_name, "默认回答")
            print(f"👤 用户回答: {user_answer}")
            
            # 发送用户输入
            input_data = {
                "user_input": user_answer,
                "context": {"slot_name": slot_name}
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/input",
                json=input_data,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"❌ 处理输入失败: {response.status_code}")
                break
            
            result = response.json()
            next_action = result.get("data", {})
            
            print(f"✅ 第{conversation_round}轮完成")
            conversation_round += 1
            
            time.sleep(1)  # 模拟思考时间
        
        # 3. 检查对话状态
        print_step("步骤 3", "检查对话状态")
        
        response = requests.get(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/status",
            timeout=10
        )
        
        if response.status_code == 200:
            status_data = response.json()
            print("✅ 对话状态获取成功")
            
            print(f"📊 对话进度: {status_data.get('progress', 0):.1%}")
            print(f"📋 当前状态: {status_data.get('status', 'unknown')}")
            print(f"🎯 已完成任务: {len(status_data.get('tasks', []))}")
            
            current_state = status_data.get('current_state', {})
            print("\n📝 收集到的信息:")
            for key, value in current_state.items():
                if value is not None and key != 'knowledge_context':
                    print(f"  • {key}: {value}")
        
        # 4. 生成内容
        if next_action.get("action") == "plan":
            print_step("步骤 4", "生成网站内容")
            
            tasks = next_action.get("tasks", [])
            if tasks:
                task_data = tasks[0]  # 使用第一个任务
                print(f"📝 生成内容类型: {task_data.get('page_type', 'general')}")
                
                response = requests.post(
                    f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/generate",
                    json={"task_data": task_data},
                    timeout=30
                )
                
                if response.status_code == 200:
                    gen_result = response.json()
                    print("✅ 内容生成成功")
                    
                    content_data = gen_result.get("data", {})
                    content = content_data.get("content", {})
                    
                    if content:
                        print("\n🎨 生成的内容预览:")
                        if "title" in content:
                            print(f"📰 标题: {content['title']}")
                        if "headings" in content:
                            print(f"📋 章节: {', '.join(content['headings'][:3])}...")
                        if "paragraphs" in content:
                            print(f"📝 段落数: {len(content['paragraphs'])}")
                        
                        knowledge_used = content_data.get("knowledge_used", [])
                        if knowledge_used:
                            print(f"🧠 使用的知识: {', '.join(knowledge_used)}")
                else:
                    print(f"❌ 内容生成失败: {response.status_code}")
        
        # 5. 完成对话
        print_step("步骤 5", "完成对话")
        
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/complete",
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ 对话完成")
        else:
            print(f"❌ 完成对话失败: {response.status_code}")
        
        return run_id
        
    except Exception as e:
        print(f"❌ 演示过程中出错: {e}")
        return None

def demo_workflow_execution():
    """演示工作流执行"""
    print_header("工作流引擎演示")
    
    try:
        # 创建一个简单对话用于工作流演示
        conversation_data = {"user_intent": "工作流演示"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=30
        )
        
        if response.status_code != 200:
            print("❌ 创建演示对话失败")
            return
        
        run_id = response.json()["run_id"]
        
        # 执行标准工作流
        print_step("标准工作流", "执行 Planner → Writer 工作流")
        
        workflow_data = {"workflow_type": "standard"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/workflow",
            json=workflow_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 标准工作流执行成功")
            
            workflow_data = result.get("data", {})
            results = workflow_data.get("results", [])
            print(f"📊 工作流结果数: {len(results)}")
        else:
            print(f"❌ 标准工作流执行失败: {response.status_code}")
        
        # 执行带校验的工作流
        print_step("校验工作流", "执行 Planner → Writer → Verifier 工作流")
        
        workflow_data = {"workflow_type": "with_verification"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/workflow",
            json=workflow_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 校验工作流执行成功")
            
            workflow_data = result.get("data", {})
            results = workflow_data.get("results", [])
            print(f"📊 工作流结果数: {len(results)}")
        else:
            print(f"❌ 校验工作流执行失败: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 工作流演示出错: {e}")

def main():
    """主函数"""
    print_header("GeoCMS AI Native 功能演示")
    print("这个演示将展示AI Native多Agent系统的核心功能")
    print("包括状态驱动对话、动态槽位询问、Agent协同等")
    
    # 检查API服务
    if not check_api_health():
        return
    
    # 演示AI Native对话
    run_id = demo_ai_native_conversation()
    
    if run_id:
        print(f"\n🎉 AI Native对话演示完成！对话ID: {run_id}")
    
    # 演示工作流执行
    demo_workflow_execution()
    
    print_header("演示完成")
    print("🎉 恭喜！您已经体验了GeoCMS AI Native的核心功能")
    print("\n📚 更多信息:")
    print("• 用户指南: docs/30_USER_GUIDE.md")
    print("• API文档: http://localhost:8000/docs")
    print("• 前端界面: http://localhost:8501")
    print("\n🚀 开始使用GeoCMS AI Native创建您的专业网站内容吧！")

if __name__ == "__main__":
    main()
