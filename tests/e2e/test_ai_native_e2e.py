"""
AI Native端到端测试
"""
import pytest
import requests
import time
import json
from typing import Dict, Any

# 测试配置
API_BASE_URL = "http://localhost:8000"
TIMEOUT = 30

class TestAINativeE2E:
    """AI Native端到端测试"""
    
    def test_complete_ai_native_workflow(self):
        """测试完整的AI Native工作流程"""
        
        # 1. 健康检查
        response = requests.get(f"{API_BASE_URL}/api/ai-native/health", timeout=5)
        assert response.status_code == 200
        health_data = response.json()
        assert health_data["status"] == "healthy"
        
        # 2. 开始对话
        conversation_data = {
            "user_intent": "我想创建一个科技公司的企业官网"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        start_result = response.json()
        assert start_result["status"] == "conversation_started"
        assert "run_id" in start_result
        assert "next_action" in start_result
        
        run_id = start_result["run_id"]
        next_action = start_result["next_action"]
        
        # 验证第一个行动是询问槽位
        assert next_action["action"] == "ask_slot"
        assert "slot_name" in next_action
        assert "prompt" in next_action
        
        # 3. 模拟多轮对话填充槽位
        conversation_steps = [
            {
                "slot_name": "site_type",
                "user_input": "企业官网",
                "expected_next": ["ask_slot", "plan"]
            },
            {
                "slot_name": "brand_name", 
                "user_input": "GeoCMS科技",
                "expected_next": ["ask_slot", "plan"]
            },
            {
                "slot_name": "target_audience",
                "user_input": "中小企业主",
                "expected_next": ["ask_slot", "plan"]
            }
        ]
        
        current_action = next_action
        
        for step in conversation_steps:
            if current_action.get("action") != "ask_slot":
                break
                
            # 提交槽位回答
            input_data = {
                "user_input": step["user_input"],
                "context": {"slot_name": step["slot_name"]}
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/input",
                json=input_data,
                timeout=TIMEOUT
            )
            
            assert response.status_code == 200
            result = response.json()
            assert result["action"] in step["expected_next"]
            
            current_action = result.get("data", {})
        
        # 4. 检查对话状态
        response = requests.get(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/status",
            timeout=10
        )
        
        assert response.status_code == 200
        status_data = response.json()
        assert status_data["run_id"] == run_id
        assert "current_state" in status_data
        assert "progress" in status_data
        assert "tasks" in status_data
        
        # 验证状态中包含我们填充的信息
        current_state = status_data["current_state"]
        assert current_state.get("site_type") == "企业官网"
        assert current_state.get("brand_name") == "GeoCMS科技"
        
        # 5. 如果可以生成内容，执行内容生成
        if current_action.get("action") == "plan":
            tasks = current_action.get("tasks", [])
            if tasks:
                task_data = tasks[0]  # 使用第一个任务
                
                response = requests.post(
                    f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/generate",
                    json={"task_data": task_data},
                    timeout=TIMEOUT
                )
                
                assert response.status_code == 200
                gen_result = response.json()
                assert gen_result["action"] == "content_generated"
                assert "data" in gen_result
                
                content_data = gen_result["data"]
                assert content_data["status"] == "content_generated"
                assert "content_block_id" in content_data
                assert "content" in content_data
                
                # 验证生成的内容结构
                content = content_data["content"]
                assert isinstance(content, dict)
                # 内容应该包含基本结构
                expected_keys = ["title", "headings", "paragraphs"]
                for key in expected_keys:
                    if key in content:
                        assert content[key] is not None
        
        # 6. 完成对话
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/complete",
            timeout=10
        )
        
        assert response.status_code == 200
        complete_result = response.json()
        assert complete_result["action"] == "conversation_completed"
    
    def test_workflow_execution(self):
        """测试工作流执行"""
        
        # 1. 开始对话
        conversation_data = {
            "user_intent": "创建产品介绍页面"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        start_result = response.json()
        run_id = start_result["run_id"]
        
        # 2. 执行标准工作流
        workflow_data = {
            "workflow_type": "standard"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/workflow",
            json=workflow_data,
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        workflow_result = response.json()
        assert workflow_result["action"] == "workflow_executed"
        assert "data" in workflow_result
        
        workflow_data = workflow_result["data"]
        assert workflow_data["workflow"] == "standard"
        assert "results" in workflow_data
    
    def test_error_handling(self):
        """测试错误处理"""
        
        # 1. 测试不存在的对话
        response = requests.get(
            f"{API_BASE_URL}/api/ai-native/conversations/999999/status",
            timeout=10
        )
        assert response.status_code == 404
        
        # 2. 测试无效的工作流类型
        # 先创建一个对话
        conversation_data = {"user_intent": "测试"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=TIMEOUT
        )
        run_id = response.json()["run_id"]
        
        # 使用无效的工作流类型
        workflow_data = {"workflow_type": "invalid_workflow"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations/{run_id}/workflow",
            json=workflow_data,
            timeout=10
        )
        assert response.status_code == 400
    
    def test_backward_compatibility(self):
        """测试向后兼容性"""
        
        # 1. 测试传统API仍然工作
        prompt_data = {
            "prompt": "写一篇关于人工智能的简短介绍"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/run-prompt",
            json=prompt_data,
            timeout=TIMEOUT
        )
        
        assert response.status_code == 200
        result = response.json()
        # 应该返回内容或缺失知识信息
        assert "content" in result or "missing_knowledge" in result
        
        # 2. 测试知识库API仍然工作
        response = requests.get(
            f"{API_BASE_URL}/api/knowledge",
            timeout=10
        )
        
        assert response.status_code == 200
        knowledge_list = response.json()
        assert isinstance(knowledge_list, list)

class TestAINativePerformance:
    """AI Native性能测试"""
    
    def test_api_response_time(self):
        """测试API响应时间"""
        
        # 健康检查响应时间
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/api/ai-native/health", timeout=5)
        health_time = time.time() - start_time
        
        assert response.status_code == 200
        assert health_time < 1.0  # 健康检查应该在1秒内完成
        
        # 对话开始响应时间
        start_time = time.time()
        conversation_data = {"user_intent": "性能测试"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=10
        )
        conversation_time = time.time() - start_time
        
        assert response.status_code == 200
        assert conversation_time < 5.0  # 对话开始应该在5秒内完成
    
    def test_concurrent_conversations(self):
        """测试并发对话处理"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def create_conversation(thread_id):
            try:
                conversation_data = {
                    "user_intent": f"并发测试对话 {thread_id}"
                }
                
                response = requests.post(
                    f"{API_BASE_URL}/api/ai-native/conversations",
                    json=conversation_data,
                    timeout=15
                )
                
                results.put({
                    "thread_id": thread_id,
                    "status_code": response.status_code,
                    "success": response.status_code == 200
                })
            except Exception as e:
                results.put({
                    "thread_id": thread_id,
                    "status_code": None,
                    "success": False,
                    "error": str(e)
                })
        
        # 创建5个并发线程
        threads = []
        for i in range(5):
            thread = threading.Thread(target=create_conversation, args=(i,))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join(timeout=20)
        
        # 检查结果
        success_count = 0
        while not results.empty():
            result = results.get()
            if result["success"]:
                success_count += 1
        
        # 至少80%的请求应该成功
        assert success_count >= 4

if __name__ == "__main__":
    # 可以直接运行这个文件进行快速测试
    print("开始AI Native端到端测试...")
    
    try:
        # 简单的健康检查
        response = requests.get(f"{API_BASE_URL}/api/ai-native/health", timeout=5)
        if response.status_code == 200:
            print("✅ API服务正常")
        else:
            print("❌ API服务异常")
            exit(1)
        
        # 简单的对话测试
        conversation_data = {"user_intent": "快速测试"}
        response = requests.post(
            f"{API_BASE_URL}/api/ai-native/conversations",
            json=conversation_data,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ AI Native对话功能正常")
        else:
            print("❌ AI Native对话功能异常")
            exit(1)
        
        print("🎉 所有基本功能测试通过！")
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务，请确保服务正在运行")
        exit(1)
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        exit(1)
