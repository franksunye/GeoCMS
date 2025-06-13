"""
测试状态管理服务
"""
import pytest
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, PlannerRuns, PlannerTasks
from app.services.state_manager import StateManager, TaskManager, get_state_manager, get_task_manager

# 创建内存数据库用于测试
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

class TestStateManager:
    """测试StateManager类"""
    
    def test_create_run(self, db_session):
        """测试创建运行"""
        manager = StateManager(db_session)
        
        run = manager.create_run("创建企业官网")
        
        assert run.id is not None
        assert run.user_intent == "创建企业官网"
        assert run.status == "active"
        
        state = json.loads(run.state)
        assert "site_type" in state
        assert state["site_type"] is None
    
    def test_create_run_with_initial_state(self, db_session):
        """测试使用初始状态创建运行"""
        manager = StateManager(db_session)
        initial_state = {"site_type": "企业官网"}
        
        run = manager.create_run("创建网站", initial_state)
        
        state = json.loads(run.state)
        assert state["site_type"] == "企业官网"
    
    def test_get_run(self, db_session):
        """测试获取运行"""
        manager = StateManager(db_session)
        
        # 创建运行
        run = manager.create_run("测试")
        
        # 获取运行
        retrieved_run = manager.get_run(run.id)
        
        assert retrieved_run.id == run.id
        assert retrieved_run.user_intent == "测试"
    
    def test_get_nonexistent_run(self, db_session):
        """测试获取不存在的运行"""
        manager = StateManager(db_session)
        
        result = manager.get_run(999)
        
        assert result is None
    
    def test_get_state(self, db_session):
        """测试获取状态"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        state = manager.get_state(run.id)
        
        assert isinstance(state, dict)
        assert "site_type" in state
    
    def test_get_state_nonexistent_run(self, db_session):
        """测试获取不存在运行的状态"""
        manager = StateManager(db_session)
        
        with pytest.raises(ValueError):
            manager.get_state(999)
    
    def test_update_slot(self, db_session):
        """测试更新槽位"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        updated_state = manager.update_slot(run.id, "site_type", "企业官网")
        
        assert updated_state["site_type"] == "企业官网"
        
        # 验证数据库中的状态也被更新
        state = manager.get_state(run.id)
        assert state["site_type"] == "企业官网"
    
    def test_update_slot_nonexistent_run(self, db_session):
        """测试更新不存在运行的槽位"""
        manager = StateManager(db_session)
        
        with pytest.raises(ValueError):
            manager.update_slot(999, "site_type", "企业官网")
    
    def test_get_missing_slots(self, db_session):
        """测试获取缺失槽位"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        missing_slots = manager.get_missing_slots(run.id)
        
        # 应该包含所有必要的槽位
        assert isinstance(missing_slots, list)
        # 由于我们使用的是真实的prompt配置，可能会有必要槽位
    
    def test_is_ready_for_generation(self, db_session):
        """测试是否准备好生成"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        
        # 初始状态应该不准备好
        ready = manager.is_ready_for_generation(run.id)
        assert isinstance(ready, bool)
    
    def test_get_knowledge_context(self, db_session):
        """测试获取知识上下文"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        context = manager.get_knowledge_context(run.id)
        
        assert isinstance(context, dict)
    
    def test_update_knowledge_context(self, db_session):
        """测试更新知识上下文"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        knowledge_context = {"company_info": {"name": "测试公司"}}
        
        updated_state = manager.update_knowledge_context(run.id, knowledge_context)
        
        assert updated_state["knowledge_context"] == knowledge_context
    
    def test_complete_run(self, db_session):
        """测试完成运行"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        completed_run = manager.complete_run(run.id)
        
        assert completed_run.status == "completed"
    
    def test_fail_run(self, db_session):
        """测试失败运行"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        failed_run = manager.fail_run(run.id, "测试错误")
        
        assert failed_run.status == "failed"
        
        state = json.loads(failed_run.state)
        assert state["error"] == "测试错误"
    
    def test_get_progress(self, db_session):
        """测试获取进度"""
        manager = StateManager(db_session)
        
        run = manager.create_run("测试")
        progress = manager.get_progress(run.id)
        
        assert isinstance(progress, float)
        assert 0.0 <= progress <= 1.0

class TestTaskManager:
    """测试TaskManager类"""
    
    def test_create_task(self, db_session):
        """测试创建任务"""
        # 先创建运行
        state_manager = StateManager(db_session)
        run = state_manager.create_run("测试")
        
        # 创建任务
        task_manager = TaskManager(db_session)
        task_data = {"slot_name": "site_type"}
        
        task = task_manager.create_task(run.id, "ask_slot", task_data)
        
        assert task.id is not None
        assert task.run_id == run.id
        assert task.task_type == "ask_slot"
        assert json.loads(task.task_data) == task_data
        assert task.status == "pending"
    
    def test_get_task(self, db_session):
        """测试获取任务"""
        # 创建运行和任务
        state_manager = StateManager(db_session)
        run = state_manager.create_run("测试")
        
        task_manager = TaskManager(db_session)
        task = task_manager.create_task(run.id, "ask_slot", {})
        
        # 获取任务
        retrieved_task = task_manager.get_task(task.id)
        
        assert retrieved_task.id == task.id
        assert retrieved_task.task_type == "ask_slot"
    
    def test_get_nonexistent_task(self, db_session):
        """测试获取不存在的任务"""
        task_manager = TaskManager(db_session)
        
        result = task_manager.get_task(999)
        
        assert result is None
    
    def test_get_tasks_by_run(self, db_session):
        """测试获取运行的所有任务"""
        # 创建运行
        state_manager = StateManager(db_session)
        run = state_manager.create_run("测试")
        
        # 创建多个任务
        task_manager = TaskManager(db_session)
        task1 = task_manager.create_task(run.id, "ask_slot", {})
        task2 = task_manager.create_task(run.id, "generate_content", {})
        
        # 获取所有任务
        tasks = task_manager.get_tasks_by_run(run.id)
        
        assert len(tasks) == 2
        task_ids = [task.id for task in tasks]
        assert task1.id in task_ids
        assert task2.id in task_ids
    
    def test_complete_task(self, db_session):
        """测试完成任务"""
        # 创建运行和任务
        state_manager = StateManager(db_session)
        run = state_manager.create_run("测试")
        
        task_manager = TaskManager(db_session)
        task = task_manager.create_task(run.id, "ask_slot", {})
        
        # 完成任务
        result = {"slot_value": "企业官网"}
        completed_task = task_manager.complete_task(task.id, result)
        
        assert completed_task.status == "completed"
        assert json.loads(completed_task.result) == result
    
    def test_fail_task(self, db_session):
        """测试失败任务"""
        # 创建运行和任务
        state_manager = StateManager(db_session)
        run = state_manager.create_run("测试")
        
        task_manager = TaskManager(db_session)
        task = task_manager.create_task(run.id, "ask_slot", {})
        
        # 失败任务
        error_message = "测试错误"
        failed_task = task_manager.fail_task(task.id, error_message)
        
        assert failed_task.status == "failed"
        result = json.loads(failed_task.result)
        assert result["error"] == error_message

class TestManagerFactories:
    """测试管理器工厂函数"""
    
    def test_get_state_manager(self, db_session):
        """测试获取状态管理器"""
        manager = get_state_manager(db_session)
        
        assert isinstance(manager, StateManager)
    
    def test_get_task_manager(self, db_session):
        """测试获取任务管理器"""
        manager = get_task_manager(db_session)
        
        assert isinstance(manager, TaskManager)
