"""
Agent协调器 - 管理多Agent协同工作
"""
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.services.state_manager import get_state_manager, get_task_manager
from app.agents.planner import analyze_next_action, process_slot_input, create_planner_run
from app.agents.writer import write_content
from app.models import ContentBlock, AgentPrompt

class AgentCoordinator:
    """Agent协调器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.state_manager = get_state_manager(db)
        self.task_manager = get_task_manager(db)
    
    def start_conversation(self, user_intent: str) -> Dict[str, Any]:
        """
        开始新的对话
        
        Args:
            user_intent: 用户意图
            
        Returns:
            对话开始结果
        """
        try:
            result = create_planner_run(user_intent, self.db)
            
            if "error" in result:
                return result
            
            return {
                "status": "conversation_started",
                "run_id": result["run_id"],
                "next_action": result["next_action"]
            }
        
        except Exception as e:
            return {"error": f"Failed to start conversation: {str(e)}"}
    
    def process_user_input(self, run_id: int, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        处理用户输入
        
        Args:
            run_id: 运行ID
            user_input: 用户输入
            context: 上下文信息
            
        Returns:
            处理结果
        """
        try:
            # 检查运行是否存在
            run = self.state_manager.get_run(run_id)
            if not run:
                return {"error": "Run not found"}
            
            # 如果上下文中包含槽位信息，处理槽位输入
            if context and "slot_name" in context:
                return process_slot_input(run_id, context["slot_name"], user_input, self.db)
            
            # 否则分析下一步行动
            return analyze_next_action(run_id, user_input, self.db)
        
        except Exception as e:
            return {"error": f"Failed to process input: {str(e)}"}
    
    def execute_content_generation(self, run_id: int, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行内容生成
        
        Args:
            run_id: 运行ID
            task_data: 任务数据
            
        Returns:
            生成结果
        """
        try:
            # 获取知识上下文
            knowledge_context = self.state_manager.get_knowledge_context(run_id)
            
            # 准备Writer任务
            writer_task = {
                "prompt": f"生成{task_data.get('page_type', 'general')}页面内容",
                "page_type": task_data.get("page_type", "general"),
                "knowledge_context": knowledge_context
            }
            
            # 调用Writer Agent
            content = write_content(writer_task)
            
            # 保存内容到数据库
            content_block = self._save_content_block(run_id, content, task_data)
            
            # 创建任务记录
            task = self.task_manager.create_task(run_id, "generate_content", task_data)
            self.task_manager.complete_task(task.id, {
                "content_block_id": content_block.id,
                "page_type": task_data.get("page_type")
            })
            
            return {
                "status": "content_generated",
                "content_block_id": content_block.id,
                "content": content,
                "knowledge_used": list(knowledge_context.keys()) if knowledge_context else []
            }
        
        except Exception as e:
            return {"error": f"Content generation failed: {str(e)}"}
    
    def execute_content_verification(self, content_block_id: int) -> Dict[str, Any]:
        """
        执行内容校验（可选功能）
        
        Args:
            content_block_id: 内容块ID
            
        Returns:
            校验结果
        """
        try:
            # 获取内容块
            content_block = self.db.query(ContentBlock).filter(
                ContentBlock.id == content_block_id
            ).first()
            
            if not content_block:
                return {"error": "Content block not found"}
            
            # 这里可以集成Verifier Agent
            # 目前返回模拟的校验结果
            verification_result = {
                "overall_score": 0.85,
                "passed": True,
                "grade": "good",
                "issues_found": [],
                "suggestions": []
            }
            
            return {
                "status": "content_verified",
                "verification_result": verification_result
            }
        
        except Exception as e:
            return {"error": f"Content verification failed: {str(e)}"}
    
    def get_conversation_status(self, run_id: int) -> Dict[str, Any]:
        """
        获取对话状态
        
        Args:
            run_id: 运行ID
            
        Returns:
            对话状态
        """
        try:
            run = self.state_manager.get_run(run_id)
            if not run:
                return {"error": "Run not found"}
            
            state = self.state_manager.get_state(run_id)
            tasks = self.task_manager.get_tasks_by_run(run_id)
            progress = self.state_manager.get_progress(run_id)
            
            return {
                "run_id": run_id,
                "user_intent": run.user_intent,
                "status": run.status,
                "current_state": state,
                "progress": progress,
                "tasks": [
                    {
                        "id": task.id,
                        "type": task.task_type,
                        "status": task.status,
                        "data": json.loads(task.task_data),
                        "result": json.loads(task.result) if task.result else None
                    }
                    for task in tasks
                ]
            }
        
        except Exception as e:
            return {"error": f"Failed to get status: {str(e)}"}
    
    def complete_conversation(self, run_id: int) -> Dict[str, Any]:
        """
        完成对话
        
        Args:
            run_id: 运行ID
            
        Returns:
            完成结果
        """
        try:
            run = self.state_manager.complete_run(run_id)
            
            return {
                "status": "conversation_completed",
                "run_id": run_id,
                "final_status": run.status
            }
        
        except Exception as e:
            return {"error": f"Failed to complete conversation: {str(e)}"}
    
    def _save_content_block(self, run_id: int, content: Dict[str, Any], task_data: Dict[str, Any]) -> ContentBlock:
        """
        保存内容块到数据库
        
        Args:
            run_id: 运行ID
            content: 生成的内容
            task_data: 任务数据
            
        Returns:
            保存的ContentBlock实例
        """
        # 获取或创建AgentPrompt
        run = self.state_manager.get_run(run_id)
        
        # 查找是否已有相关的prompt
        prompt = self.db.query(AgentPrompt).filter(
            AgentPrompt.prompt_text == run.user_intent
        ).first()
        
        if not prompt:
            prompt = AgentPrompt(prompt_text=run.user_intent)
            self.db.add(prompt)
            self.db.commit()
            self.db.refresh(prompt)
        
        # 创建内容块
        content_block = ContentBlock(
            prompt_id=prompt.id,
            content=json.dumps(content, ensure_ascii=False),
            block_type=task_data.get("page_type", "general")
        )
        
        self.db.add(content_block)
        self.db.commit()
        self.db.refresh(content_block)
        
        return content_block

class WorkflowEngine:
    """工作流引擎"""
    
    def __init__(self, coordinator: AgentCoordinator):
        self.coordinator = coordinator
    
    def execute_workflow(self, run_id: int, workflow_type: str = "standard") -> Dict[str, Any]:
        """
        执行工作流
        
        Args:
            run_id: 运行ID
            workflow_type: 工作流类型
            
        Returns:
            执行结果
        """
        if workflow_type == "standard":
            return self._execute_standard_workflow(run_id)
        elif workflow_type == "with_verification":
            return self._execute_verification_workflow(run_id)
        else:
            return {"error": f"Unknown workflow type: {workflow_type}"}
    
    def _execute_standard_workflow(self, run_id: int) -> Dict[str, Any]:
        """
        执行标准工作流：Planner → Writer
        
        Args:
            run_id: 运行ID
            
        Returns:
            执行结果
        """
        results = []
        
        # 获取当前状态
        status = self.coordinator.get_conversation_status(run_id)
        if "error" in status:
            return status
        
        # 如果准备好生成内容
        if self.coordinator.state_manager.is_ready_for_generation(run_id):
            # 生成默认页面内容
            task_data = {"page_type": "homepage"}
            result = self.coordinator.execute_content_generation(run_id, task_data)
            results.append(result)
        
        return {
            "workflow": "standard",
            "results": results
        }
    
    def _execute_verification_workflow(self, run_id: int) -> Dict[str, Any]:
        """
        执行带校验的工作流：Planner → Writer → Verifier
        
        Args:
            run_id: 运行ID
            
        Returns:
            执行结果
        """
        results = []
        
        # 执行标准工作流
        standard_result = self._execute_standard_workflow(run_id)
        results.extend(standard_result.get("results", []))
        
        # 对生成的内容进行校验
        for result in results:
            if result.get("status") == "content_generated":
                content_block_id = result.get("content_block_id")
                if content_block_id:
                    verification_result = self.coordinator.execute_content_verification(content_block_id)
                    results.append(verification_result)
        
        return {
            "workflow": "with_verification",
            "results": results
        }

def get_agent_coordinator(db: Session) -> AgentCoordinator:
    """获取Agent协调器实例"""
    return AgentCoordinator(db)

def get_workflow_engine(db: Session) -> WorkflowEngine:
    """获取工作流引擎实例"""
    coordinator = get_agent_coordinator(db)
    return WorkflowEngine(coordinator)
