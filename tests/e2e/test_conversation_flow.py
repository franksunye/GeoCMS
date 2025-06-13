#!/usr/bin/env python3
"""
AI Native 对话流程端到端测试

测试完整的多轮对话流程，验证：
1. 对话开始和槽位询问
2. 槽位填充和进度跟踪
3. 知识需求检测
4. 任务生成和内容创建

这是AI Native架构的核心功能测试。
"""
import pytest
import requests
import time
from typing import Dict, Any

# 测试配置
API_BASE_URL = "http://localhost:8000"
TIMEOUT = 30

class TestConversationFlow:
    """AI Native对话流程测试"""
    
    def test_complete_conversation_flow(self):
        """测试完整的对话流程"""
        print("\n🧪 测试完整的AI Native对话流程...")
        
        # 1. 开始对话
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json={"user_intent": "我想创建一个企业官网"},
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200, f"开始对话失败: {response.status_code}"
        
        data = response.json()
        run_id = data["run_id"]
        next_action = data["next_action"]
        
        assert next_action["action"] == "ask_slot", "应该开始询问槽位"
        assert next_action["slot_name"] == "site_type", "第一个槽位应该是site_type"
        
        print(f"✅ 对话开始成功，run_id: {run_id}")
        
        # 2. 模拟填充所有槽位
        slots_to_fill = [
            ("site_type", "企业官网"),
            ("brand_name", "GeoCMS科技"),
            ("target_audience", "中小企业主"),
            ("content_goals", "品牌展示"),
            ("pages", "homepage")
        ]
        
        for i, (slot_name, value) in enumerate(slots_to_fill, 1):
            print(f"  {i}. 填充槽位 '{slot_name}': {value}")
            
            response = requests.post(
                f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/input",
                json={
                    "user_input": value,
                    "context": {"slot_name": slot_name}
                },
                timeout=TIMEOUT
            )
            
            assert response.status_code == 200, f"填充槽位失败: {response.status_code}"
            
            result = response.json()
            action_data = result.get("data", {})
            action = action_data.get("action")
            
            print(f"     下一步行动: {action}")
            
            if action == "ask_slot":
                next_slot = action_data.get("slot_name")
                progress = action_data.get("progress", 0)
                print(f"     下一个槽位: {next_slot}, 进度: {progress:.1%}")
            elif action in ["plan", "missing_knowledge"]:
                print(f"     槽位收集完成，进入: {action}")
                break
        
        # 3. 验证最终状态
        response = requests.get(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/status",
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200, "获取状态失败"
        
        status = response.json()
        assert status["progress"] == 1.0, "进度应该是100%"
        assert len(status["current_state"]) >= 5, "应该收集到所有槽位"
        
        print(f"✅ 对话流程测试完成，最终进度: {status['progress']:.1%}")
    
    def test_slot_validation(self):
        """测试槽位验证和错误处理"""
        print("\n🧪 测试槽位验证...")
        
        # 开始对话
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json={"user_intent": "创建网站"},
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        run_id = response.json()["run_id"]
        
        # 测试无效的槽位输入
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/input",
            json={
                "user_input": "测试值",
                "context": {"slot_name": "invalid_slot"}
            },
            timeout=TIMEOUT
        )
        
        # 系统应该能够处理无效槽位
        assert response.status_code in [200, 400], "应该能处理无效槽位"
        
        print("✅ 槽位验证测试完成")
    
    def test_conversation_status_tracking(self):
        """测试对话状态跟踪"""
        print("\n🧪 测试对话状态跟踪...")
        
        # 开始对话
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json={"user_intent": "创建个人博客"},
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        run_id = response.json()["run_id"]
        
        # 获取初始状态
        response = requests.get(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/status",
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        initial_status = response.json()
        
        assert initial_status["run_id"] == run_id
        assert initial_status["status"] == "active"
        assert initial_status["progress"] >= 0
        assert "current_state" in initial_status
        
        print("✅ 对话状态跟踪测试完成")
    
    def test_knowledge_detection(self):
        """测试知识需求检测"""
        print("\n🧪 测试知识需求检测...")
        
        # 开始对话
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json={"user_intent": "创建企业官网"},
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        run_id = response.json()["run_id"]
        
        # 快速填充所有槽位到触发知识检测
        slots = [
            ("site_type", "企业官网"),
            ("brand_name", "测试公司"),
            ("target_audience", "企业客户"),
            ("content_goals", "品牌展示"),
            ("pages", "homepage")
        ]
        
        for slot_name, value in slots:
            response = requests.post(
                f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/input",
                json={
                    "user_input": value,
                    "context": {"slot_name": slot_name}
                },
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                action_data = result.get("data", {})
                
                # 检查是否检测到缺失知识
                if action_data.get("action") == "missing_knowledge":
                    missing_knowledge = action_data.get("missing_knowledge", [])
                    assert len(missing_knowledge) > 0, "应该检测到缺失的知识"
                    print(f"     检测到缺失知识: {[k.get('topic') for k in missing_knowledge]}")
                    break
        
        print("✅ 知识需求检测测试完成")

def test_api_health():
    """测试API健康状态"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/ai-native/health", timeout=5)
        assert response.status_code == 200
        print("✅ API服务正常")
    except:
        print("❌ API服务不可用")
        pytest.fail("API服务不可用")

if __name__ == "__main__":
    print("🚀 AI Native 对话流程端到端测试")
    print("=" * 50)
    
    # 检查API服务
    try:
        test_api_health()
    except:
        print("\n❌ 请先启动后端服务:")
        print("   uvicorn app.main:app --reload")
        exit(1)
    
    # 运行测试
    test_instance = TestConversationFlow()
    
    try:
        test_instance.test_complete_conversation_flow()
        test_instance.test_slot_validation()
        test_instance.test_conversation_status_tracking()
        test_instance.test_knowledge_detection()
        
        print("\n🎉 所有测试通过！")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        exit(1)
