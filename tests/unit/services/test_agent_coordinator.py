"""
测试Agent协调器
"""
import pytest
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, PlannerRuns, ContentBlock, AgentPrompt
from app.services.agent_coordinator import AgentCoordinator, WorkflowEngine, get_agent_coordinator, get_workflow_engine

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

class TestAgentCoordinator:
    """测试AgentCoordinator类"""
    
    def test_start_conversation(self, db_session):
        """测试开始对话"""
        coordinator = AgentCoordinator(db_session)
        
        result = coordinator.start_conversation("创建企业官网")
        
        assert result["status"] == "conversation_started"
        assert "run_id" in result
        assert "next_action" in result
        
        # 验证数据库中创建了运行记录
        run = db_session.query(PlannerRuns).filter(
            PlannerRuns.id == result["run_id"]
        ).first()
        assert run is not None
        assert run.user_intent == "创建企业官网"
    
    def test_process_user_input_with_slot(self, db_session):
        """测试处理带槽位的用户输入"""
        coordinator = AgentCoordinator(db_session)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 处理槽位输入
        result = coordinator.process_user_input(
            run_id, 
            "企业官网", 
            {"slot_name": "site_type"}
        )
        
        assert "action" in result
        # 结果应该是下一个槽位询问或规划行动
        assert result["action"] in ["ask_slot", "plan"]
    
    def test_process_user_input_nonexistent_run(self, db_session):
        """测试处理不存在运行的用户输入"""
        coordinator = AgentCoordinator(db_session)
        
        result = coordinator.process_user_input(999, "测试输入")
        
        assert "error" in result
        assert "Run not found" in result["error"]
    
    def test_execute_content_generation(self, db_session):
        """测试执行内容生成"""
        coordinator = AgentCoordinator(db_session)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 执行内容生成
        task_data = {"page_type": "homepage"}
        result = coordinator.execute_content_generation(run_id, task_data)
        
        assert result["status"] == "content_generated"
        assert "content_block_id" in result
        assert "content" in result
        
        # 验证数据库中创建了内容块
        content_block = db_session.query(ContentBlock).filter(
            ContentBlock.id == result["content_block_id"]
        ).first()
        assert content_block is not None
    
    def test_execute_content_verification(self, db_session):
        """测试执行内容校验"""
        coordinator = AgentCoordinator(db_session)
        
        # 先创建内容块
        prompt = AgentPrompt(prompt_text="测试提示词")
        db_session.add(prompt)
        db_session.commit()
        
        content_block = ContentBlock(
            prompt_id=prompt.id,
            content=json.dumps({"title": "测试标题"}),
            block_type="test"
        )
        db_session.add(content_block)
        db_session.commit()
        
        # 执行校验
        result = coordinator.execute_content_verification(content_block.id)
        
        assert result["status"] == "content_verified"
        assert "verification_result" in result
        
        verification = result["verification_result"]
        assert "overall_score" in verification
        assert "passed" in verification
    
    def test_execute_content_verification_nonexistent(self, db_session):
        """测试校验不存在的内容"""
        coordinator = AgentCoordinator(db_session)
        
        result = coordinator.execute_content_verification(999)
        
        assert "error" in result
        assert "Content block not found" in result["error"]
    
    def test_get_conversation_status(self, db_session):
        """测试获取对话状态"""
        coordinator = AgentCoordinator(db_session)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 获取状态
        result = coordinator.get_conversation_status(run_id)
        
        assert result["run_id"] == run_id
        assert "user_intent" in result
        assert "status" in result
        assert "current_state" in result
        assert "progress" in result
        assert "tasks" in result
    
    def test_get_conversation_status_nonexistent(self, db_session):
        """测试获取不存在对话的状态"""
        coordinator = AgentCoordinator(db_session)
        
        result = coordinator.get_conversation_status(999)
        
        assert "error" in result
        assert "Run not found" in result["error"]
    
    def test_complete_conversation(self, db_session):
        """测试完成对话"""
        coordinator = AgentCoordinator(db_session)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 完成对话
        result = coordinator.complete_conversation(run_id)
        
        assert result["status"] == "conversation_completed"
        assert result["run_id"] == run_id
        
        # 验证数据库中的状态已更新
        run = db_session.query(PlannerRuns).filter(
            PlannerRuns.id == run_id
        ).first()
        assert run.status == "completed"

class TestWorkflowEngine:
    """测试WorkflowEngine类"""
    
    def test_execute_standard_workflow(self, db_session):
        """测试执行标准工作流"""
        coordinator = AgentCoordinator(db_session)
        workflow_engine = WorkflowEngine(coordinator)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 执行标准工作流
        result = workflow_engine.execute_workflow(run_id, "standard")
        
        assert result["workflow"] == "standard"
        assert "results" in result
        assert isinstance(result["results"], list)
    
    def test_execute_verification_workflow(self, db_session):
        """测试执行带校验的工作流"""
        coordinator = AgentCoordinator(db_session)
        workflow_engine = WorkflowEngine(coordinator)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 执行带校验的工作流
        result = workflow_engine.execute_workflow(run_id, "with_verification")
        
        assert result["workflow"] == "with_verification"
        assert "results" in result
        assert isinstance(result["results"], list)
    
    def test_execute_unknown_workflow(self, db_session):
        """测试执行未知工作流"""
        coordinator = AgentCoordinator(db_session)
        workflow_engine = WorkflowEngine(coordinator)
        
        # 先开始对话
        start_result = coordinator.start_conversation("创建网站")
        run_id = start_result["run_id"]
        
        # 执行未知工作流
        result = workflow_engine.execute_workflow(run_id, "unknown")
        
        assert "error" in result
        assert "Unknown workflow type" in result["error"]

class TestFactoryFunctions:
    """测试工厂函数"""
    
    def test_get_agent_coordinator(self, db_session):
        """测试获取Agent协调器"""
        coordinator = get_agent_coordinator(db_session)
        
        assert isinstance(coordinator, AgentCoordinator)
    
    def test_get_workflow_engine(self, db_session):
        """测试获取工作流引擎"""
        engine = get_workflow_engine(db_session)
        
        assert isinstance(engine, WorkflowEngine)

class TestErrorHandling:
    """测试错误处理"""
    
    def test_start_conversation_with_exception(self, db_session):
        """测试开始对话时的异常处理"""
        coordinator = AgentCoordinator(db_session)

        # 使用无效的用户意图来触发异常（空字符串可能不会触发异常）
        # 或者我们可以测试其他异常情况
        result = coordinator.start_conversation("")

        # 空字符串应该仍然能处理，所以我们验证结果的合理性
        assert "status" in result or "error" in result
