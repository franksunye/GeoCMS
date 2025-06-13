"""
测试AI Native数据模型
"""
import pytest
import json
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, PlannerRuns, PlannerTasks, VerifierLogs, ContentBlock, AgentPrompt

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

class TestPlannerRuns:
    """测试PlannerRuns模型"""
    
    def test_create_planner_run(self, db_session):
        """测试创建规划运行"""
        state = {
            "site_type": "企业官网",
            "brand_name": None,
            "target_audience": None
        }
        
        run = PlannerRuns(
            user_intent="创建企业官网",
            state=json.dumps(state, ensure_ascii=False),
            status="active"
        )
        
        db_session.add(run)
        db_session.commit()
        db_session.refresh(run)
        
        assert run.id is not None
        assert run.user_intent == "创建企业官网"
        assert json.loads(run.state) == state
        assert run.status == "active"
        assert run.created_at is not None
        assert run.updated_at is not None
    
    def test_planner_run_default_status(self, db_session):
        """测试默认状态"""
        run = PlannerRuns(
            user_intent="测试意图",
            state=json.dumps({})
        )
        
        db_session.add(run)
        db_session.commit()
        
        assert run.status == "active"
    
    def test_planner_run_relationships(self, db_session):
        """测试关系映射"""
        run = PlannerRuns(
            user_intent="测试意图",
            state=json.dumps({})
        )
        
        db_session.add(run)
        db_session.commit()
        db_session.refresh(run)
        
        # 测试tasks关系
        assert run.tasks == []

class TestPlannerTasks:
    """测试PlannerTasks模型"""
    
    def test_create_planner_task(self, db_session):
        """测试创建规划任务"""
        # 先创建run
        run = PlannerRuns(
            user_intent="创建企业官网",
            state=json.dumps({})
        )
        db_session.add(run)
        db_session.commit()
        db_session.refresh(run)
        
        # 创建task
        task_data = {
            "slot_name": "brand_name",
            "prompt": "请告诉我您的品牌名称"
        }
        
        task = PlannerTasks(
            run_id=run.id,
            task_type="ask_slot",
            task_data=json.dumps(task_data, ensure_ascii=False),
            status="pending"
        )
        
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)
        
        assert task.id is not None
        assert task.run_id == run.id
        assert task.task_type == "ask_slot"
        assert json.loads(task.task_data) == task_data
        assert task.status == "pending"
        assert task.result is None
    
    def test_planner_task_with_result(self, db_session):
        """测试带结果的任务"""
        # 创建run
        run = PlannerRuns(
            user_intent="测试",
            state=json.dumps({})
        )
        db_session.add(run)
        db_session.commit()
        
        # 创建task
        task = PlannerTasks(
            run_id=run.id,
            task_type="generate_content",
            task_data=json.dumps({"page_type": "homepage"}),
            result=json.dumps({"content_id": 123}),
            status="completed"
        )
        
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)
        
        assert task.status == "completed"
        assert json.loads(task.result) == {"content_id": 123}
    
    def test_planner_task_relationships(self, db_session):
        """测试关系映射"""
        # 创建run
        run = PlannerRuns(
            user_intent="测试",
            state=json.dumps({})
        )
        db_session.add(run)
        db_session.commit()
        
        # 创建task
        task = PlannerTasks(
            run_id=run.id,
            task_type="ask_slot",
            task_data=json.dumps({})
        )
        db_session.add(task)
        db_session.commit()
        db_session.refresh(task)
        
        # 测试关系
        assert task.run.id == run.id
        assert task in run.tasks

class TestVerifierLogs:
    """测试VerifierLogs模型"""
    
    def test_create_verifier_log(self, db_session):
        """测试创建校验日志"""
        # 先创建必要的依赖数据
        prompt = AgentPrompt(prompt_text="测试提示词")
        db_session.add(prompt)
        db_session.commit()
        
        content_block = ContentBlock(
            prompt_id=prompt.id,
            content=json.dumps({"title": "测试标题"}),
            block_type="text"
        )
        db_session.add(content_block)
        db_session.commit()
        db_session.refresh(content_block)
        
        # 创建校验日志
        verification_result = {
            "score": 0.85,
            "passed": True
        }
        issues_found = [
            {"type": "style", "message": "标题可以更吸引人"}
        ]
        suggestions = [
            {"action": "improve_title", "suggestion": "添加更多关键词"}
        ]
        
        log = VerifierLogs(
            content_block_id=content_block.id,
            verification_result=json.dumps(verification_result),
            issues_found=json.dumps(issues_found),
            suggestions=json.dumps(suggestions)
        )
        
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)
        
        assert log.id is not None
        assert log.content_block_id == content_block.id
        assert json.loads(log.verification_result) == verification_result
        assert json.loads(log.issues_found) == issues_found
        assert json.loads(log.suggestions) == suggestions
        assert log.created_at is not None
    
    def test_verifier_log_relationships(self, db_session):
        """测试关系映射"""
        # 创建依赖数据
        prompt = AgentPrompt(prompt_text="测试")
        db_session.add(prompt)
        db_session.commit()
        
        content_block = ContentBlock(
            prompt_id=prompt.id,
            content=json.dumps({}),
            block_type="text"
        )
        db_session.add(content_block)
        db_session.commit()
        
        # 创建校验日志
        log = VerifierLogs(
            content_block_id=content_block.id,
            verification_result=json.dumps({"passed": True})
        )
        db_session.add(log)
        db_session.commit()
        db_session.refresh(log)
        
        # 测试关系
        assert log.content_block.id == content_block.id

class TestModelIntegration:
    """测试模型集成"""
    
    def test_complete_workflow_models(self, db_session):
        """测试完整工作流的模型交互"""
        # 1. 创建规划运行
        run = PlannerRuns(
            user_intent="创建企业官网",
            state=json.dumps({"site_type": "企业官网"})
        )
        db_session.add(run)
        db_session.commit()
        
        # 2. 创建询问任务
        ask_task = PlannerTasks(
            run_id=run.id,
            task_type="ask_slot",
            task_data=json.dumps({"slot_name": "brand_name"}),
            status="completed",
            result=json.dumps({"user_input": "GeoCMS科技"})
        )
        db_session.add(ask_task)
        
        # 3. 创建生成任务
        generate_task = PlannerTasks(
            run_id=run.id,
            task_type="generate_content",
            task_data=json.dumps({"page_type": "homepage"}),
            status="completed"
        )
        db_session.add(generate_task)
        db_session.commit()
        
        # 验证关系
        db_session.refresh(run)
        assert len(run.tasks) == 2
        assert ask_task in run.tasks
        assert generate_task in run.tasks
        
        # 验证状态
        assert run.status == "active"
        assert all(task.status == "completed" for task in run.tasks)
