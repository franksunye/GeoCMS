"""
状态管理服务
"""
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import PlannerRuns, PlannerTasks
from app.services.prompt_manager import get_prompt_manager

class StateManager:
    """状态管理器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.prompt_manager = get_prompt_manager()
    
    def create_run(self, user_intent: str, initial_state: Dict[str, Any] = None) -> PlannerRuns:
        """
        创建新的规划运行
        
        Args:
            user_intent: 用户意图
            initial_state: 初始状态
            
        Returns:
            创建的PlannerRuns实例
        """
        if initial_state is None:
            initial_state = self._get_default_state()
        
        run = PlannerRuns(
            user_intent=user_intent,
            state=json.dumps(initial_state, ensure_ascii=False),
            status="active"
        )
        
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        
        return run
    
    def get_run(self, run_id: int) -> Optional[PlannerRuns]:
        """
        获取规划运行
        
        Args:
            run_id: 运行ID
            
        Returns:
            PlannerRuns实例或None
        """
        return self.db.query(PlannerRuns).filter(PlannerRuns.id == run_id).first()
    
    def get_state(self, run_id: int) -> Dict[str, Any]:
        """
        获取运行状态
        
        Args:
            run_id: 运行ID
            
        Returns:
            状态字典
        """
        run = self.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        return json.loads(run.state)
    
    def update_slot(self, run_id: int, slot_name: str, value: Any) -> Dict[str, Any]:
        """
        更新状态槽位
        
        Args:
            run_id: 运行ID
            slot_name: 槽位名称
            value: 槽位值
            
        Returns:
            更新后的状态
        """
        run = self.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        state = json.loads(run.state)
        state[slot_name] = value
        
        run.state = json.dumps(state, ensure_ascii=False)
        self.db.commit()
        
        return state
    
    def get_missing_slots(self, run_id: int) -> List[str]:
        """
        获取缺失的必要槽位
        
        Args:
            run_id: 运行ID
            
        Returns:
            缺失槽位列表
        """
        state = self.get_state(run_id)
        slot_definitions = self.prompt_manager.get_slot_definitions("planner")
        
        missing_slots = []
        for slot_name, slot_config in slot_definitions.items():
            if slot_config.get("required", False):
                if slot_name not in state or state[slot_name] is None:
                    missing_slots.append(slot_name)
        
        # 按优先级排序
        missing_slots.sort(key=lambda x: slot_definitions[x].get("priority", 999))
        
        return missing_slots
    
    def is_ready_for_generation(self, run_id: int) -> bool:
        """
        检查是否准备好生成内容
        
        Args:
            run_id: 运行ID
            
        Returns:
            是否准备好
        """
        missing_slots = self.get_missing_slots(run_id)
        return len(missing_slots) == 0
    
    def get_knowledge_context(self, run_id: int) -> Dict[str, Any]:
        """
        获取知识上下文
        
        Args:
            run_id: 运行ID
            
        Returns:
            知识上下文字典
        """
        state = self.get_state(run_id)
        return state.get("knowledge_context", {})
    
    def update_knowledge_context(self, run_id: int, knowledge_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        更新知识上下文
        
        Args:
            run_id: 运行ID
            knowledge_context: 知识上下文
            
        Returns:
            更新后的状态
        """
        return self.update_slot(run_id, "knowledge_context", knowledge_context)
    
    def complete_run(self, run_id: int) -> PlannerRuns:
        """
        完成规划运行
        
        Args:
            run_id: 运行ID
            
        Returns:
            更新后的PlannerRuns实例
        """
        run = self.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        run.status = "completed"
        self.db.commit()
        
        return run
    
    def fail_run(self, run_id: int, error_message: str = None) -> PlannerRuns:
        """
        标记运行失败
        
        Args:
            run_id: 运行ID
            error_message: 错误信息
            
        Returns:
            更新后的PlannerRuns实例
        """
        run = self.get_run(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        run.status = "failed"
        
        # 如果有错误信息，可以存储在状态中
        if error_message:
            state = json.loads(run.state)
            state["error"] = error_message
            run.state = json.dumps(state, ensure_ascii=False)
        
        self.db.commit()
        
        return run
    
    def get_progress(self, run_id: int) -> float:
        """
        计算进度百分比
        
        Args:
            run_id: 运行ID
            
        Returns:
            进度百分比 (0.0-1.0)
        """
        slot_definitions = self.prompt_manager.get_slot_definitions("planner")
        required_slots = [name for name, config in slot_definitions.items() 
                         if config.get("required", False)]
        
        if not required_slots:
            return 1.0
        
        state = self.get_state(run_id)
        filled_slots = sum(1 for slot in required_slots 
                          if slot in state and state[slot] is not None)
        
        return filled_slots / len(required_slots)
    
    def _get_default_state(self) -> Dict[str, Any]:
        """
        获取默认状态
        
        Returns:
            默认状态字典
        """
        return {
            "site_type": None,
            "brand_name": None,
            "target_audience": None,
            "content_goals": None,
            "pages": [],
            "current_page": None,
            "knowledge_context": {}
        }

class TaskManager:
    """任务管理器"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_task(self, run_id: int, task_type: str, task_data: Dict[str, Any]) -> PlannerTasks:
        """
        创建新任务
        
        Args:
            run_id: 运行ID
            task_type: 任务类型
            task_data: 任务数据
            
        Returns:
            创建的PlannerTasks实例
        """
        task = PlannerTasks(
            run_id=run_id,
            task_type=task_type,
            task_data=json.dumps(task_data, ensure_ascii=False),
            status="pending"
        )
        
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        
        return task
    
    def get_task(self, task_id: int) -> Optional[PlannerTasks]:
        """
        获取任务
        
        Args:
            task_id: 任务ID
            
        Returns:
            PlannerTasks实例或None
        """
        return self.db.query(PlannerTasks).filter(PlannerTasks.id == task_id).first()
    
    def get_tasks_by_run(self, run_id: int) -> List[PlannerTasks]:
        """
        获取运行的所有任务
        
        Args:
            run_id: 运行ID
            
        Returns:
            任务列表
        """
        return self.db.query(PlannerTasks).filter(PlannerTasks.run_id == run_id).all()
    
    def complete_task(self, task_id: int, result: Dict[str, Any]) -> PlannerTasks:
        """
        完成任务
        
        Args:
            task_id: 任务ID
            result: 任务结果
            
        Returns:
            更新后的PlannerTasks实例
        """
        task = self.get_task(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        task.result = json.dumps(result, ensure_ascii=False)
        task.status = "completed"
        self.db.commit()
        
        return task
    
    def fail_task(self, task_id: int, error_message: str) -> PlannerTasks:
        """
        标记任务失败
        
        Args:
            task_id: 任务ID
            error_message: 错误信息
            
        Returns:
            更新后的PlannerTasks实例
        """
        task = self.get_task(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        task.result = json.dumps({"error": error_message}, ensure_ascii=False)
        task.status = "failed"
        self.db.commit()
        
        return task

def get_state_manager(db: Session) -> StateManager:
    """获取状态管理器实例"""
    return StateManager(db)

def get_task_manager(db: Session) -> TaskManager:
    """获取任务管理器实例"""
    return TaskManager(db)
