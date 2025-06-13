# 测试指南

## 测试策略

### 测试目标
1. **功能验证**
   - ✅ Prompt 处理流程
   - ✅ AI Agent 调用流程
   - ✅ **知识库管理功能**（新增）
   - ✅ **知识感知内容生成**（新增）
   - ✅ 数据持久化
   - ✅ API 接口功能
   - ✅ 错误处理机制

2. **质量指标**
   - ✅ 测试覆盖率: >95%
   - ✅ 测试通过率: 100% (98/98)
   - ✅ API 响应时间: <2秒
   - ✅ 数据一致性: 100%
   - ✅ 知识检索性能: <500ms

### 测试架构

```
tests/
├── unit/                    # 单元测试
│   ├── api/                # API层测试
│   │   ├── test_run_prompt.py
│   │   ├── test_knowledge.py    # 知识库API测试
│   │   └── test_ai_native.py    # AI Native API测试
│   ├── agents/             # Agent层测试
│   │   ├── test_planner.py     # 状态驱动Planner测试
│   │   └── test_writer.py      # 知识增强Writer测试
│   ├── services/           # 服务层测试
│   │   ├── test_knowledge.py   # 知识库服务测试
│   │   ├── test_state_manager.py    # 状态管理测试
│   │   ├── test_agent_coordinator.py # Agent协调测试
│   │   └── test_prompt_manager.py    # 配置管理测试
│   └── models/             # 模型测试
│       └── test_ai_native_models.py  # AI Native模型测试
├── integration/            # 集成测试
│   ├── test_agents_integration.py
│   ├── test_ai_native_integration.py # AI Native集成测试
│   ├── test_flow.py
│   └── test_prompt.py
├── e2e/                    # 端到端测试
│   ├── test_ai_native_e2e.py       # AI Native端到端测试
│   └── test_conversation_flow.py   # 对话流程测试
└── frontend/               # 前端测试
    └── test_streamlit_ai_native.py # AI Native前端测试
```

## 测试类型

### 1. 单元测试（pytest）

#### API 测试
```python
# 内容生成API测试
def test_run_prompt_endpoint():
    response = client.post("/api/run-prompt", json={"prompt": "test prompt"})
    assert response.status_code == 200
    assert "content" in response.json()

# 知识库API测试
def test_create_knowledge():
    knowledge_data = {
        "topic": "company_info",
        "content": {"name": "Test Company"},
        "description": "测试公司信息"
    }
    response = client.post("/api/knowledge", json=knowledge_data)
    assert response.status_code == 200
    assert response.json()["topic"] == "company_info"
```

#### 知识库服务测试
```python
def test_knowledge_service():
    service = KnowledgeService(db)
    knowledge = service.create_knowledge(
        topic="test_topic",
        content={"key": "value"},
        description="测试知识"
    )
    assert knowledge.id is not None
    assert knowledge.topic == "test_topic"
```

#### 知识感知Agent测试
```python
def test_planner_knowledge_awareness():
    planner = PlannerAgent()
    result = planner.plan_task("为我们公司创建介绍页面", db_session=db)
    assert "knowledge_context" in result
    assert result["knowledge_context"] is not None
```

### 2. 集成测试

#### 端到端知识流程测试
```python
def test_knowledge_aware_content_generation():
    # 1. 创建知识
    knowledge_data = {
        "topic": "company_info",
        "content": {"name": "GeoCMS", "description": "AI建站系统"}
    }
    client.post("/api/knowledge", json=knowledge_data)
    
    # 2. 生成内容
    response = client.post("/api/run-prompt", 
                          json={"prompt": "为我们公司创建介绍页面"})
    
    # 3. 验证知识被使用
    assert response.status_code == 200
    data = response.json()
    assert "knowledge_used" in data
    assert "company_info" in data["knowledge_used"]
```

#### 缺失知识检测测试
```python
def test_missing_knowledge_detection():
    # 清空知识库
    db.query(KnowledgeBase).delete()
    db.commit()
    
    # 请求需要知识的内容
    response = client.post("/api/run-prompt", 
                          json={"prompt": "为我们公司创建介绍页面"})
    
    # 验证缺失知识响应
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "missing_knowledge"
    assert "missing_knowledge" in data
```

### 3. 性能测试

#### 知识检索性能
```python
def test_knowledge_retrieval_performance():
    import time
    
    # 创建大量知识数据
    for i in range(100):
        service.create_knowledge(f"topic_{i}", {"data": f"value_{i}"})
    
    # 测试检索性能
    start_time = time.time()
    results = service.search_knowledge(["topic_50"])
    end_time = time.time()
    
    assert (end_time - start_time) < 0.5  # 小于500ms
    assert len(results) > 0
```

## 测试执行

### 基本命令
```bash
# 运行所有测试
pytest tests/ -v

# 快速测试（无详细输出）
pytest tests/ --tb=no -q

# 运行特定测试文件
pytest tests/unit/api/test_knowledge.py -v

# 运行特定测试类
pytest tests/unit/services/test_knowledge.py::TestKnowledgeService -v
```

### 覆盖率测试
```bash
# 查看测试覆盖率
pytest tests/ --cov=app --cov-report=term-missing

# 生成HTML覆盖率报告
pytest tests/ --cov=app --cov-report=html
```

### 并行测试
```bash
# 并行运行测试（需要pytest-xdist）
pytest tests/ -n auto
```

## 测试结果

### 最新测试状态（v0.3.0 - AI Native）

- **总测试数**：195+ 个
- **全部通过**：195+/195+ (100% 通过率)
- **测试覆盖率**：>95%
- **AI Native新增测试**：76个
  - 多轮对话流程测试：15个
  - 状态管理测试：12个
  - Agent协调测试：18个
  - 配置驱动测试：10个
  - 端到端对话测试：21个
- **知识库功能测试**：34个
- **原有功能测试**：85个（全部保持兼容）
- **配置驱动架构**：✅ 完全实现，支持热重载
- **系统健壮性**：已补充边界条件、异常分支、mock与真实LLM分支等测试

### 详细分布
- **单元测试**：165+
  - API测试：30+ (包含AI Native API)
  - Agent测试：60+ (包含状态驱动Planner)
  - 服务测试：35+ (包含状态管理、Agent协调)
  - 模型测试：15+ (包含AI Native模型)
  - 配置管理测试：25+
- **集成测试**：20+
  - AI Native工作流测试：8个
  - 知识感知生成测试：6个
  - 原有集成测试：6个
- **端到端测试**：10+
  - 完整对话流程测试：5个
  - 前端交互测试：3个
  - 配置驱动测试：2个

### 运行示例
```bash
pytest tests/ --cov=app --cov-report=term-missing
```

### 典型边界测试示例
- planner/knowledge: 空输入、None、极长字符串、特殊字符、mock db异常
- writer: mock与真实LLM分支、知识上下文为空/部分/完整、内容增强分支

## 测试最佳实践

### 1. 测试命名
```python
# 好的命名
def test_create_knowledge_with_valid_data():
def test_knowledge_search_returns_empty_when_no_matches():
def test_missing_knowledge_detection_for_company_prompt():

# 避免的命名
def test_knowledge():
def test_api():
```

### 2. 测试结构（AAA模式）
```python
def test_create_knowledge():
    # Arrange - 准备测试数据
    knowledge_data = {
        "topic": "company_info",
        "content": {"name": "Test Company"}
    }
    
    # Act - 执行被测试的操作
    response = client.post("/api/knowledge", json=knowledge_data)
    
    # Assert - 验证结果
    assert response.status_code == 200
    assert response.json()["topic"] == "company_info"
```

### 3. 测试隔离
```python
@pytest.fixture(autouse=True)
def clean_database():
    """每个测试前清理数据库"""
    yield
    db.query(KnowledgeBase).delete()
    db.query(AgentPrompt).delete()
    db.query(ContentBlock).delete()
    db.commit()
```

### 4. Mock使用
```python
@patch('app.agents.writer.OpenAI')
def test_writer_with_mock_llm(mock_openai):
    mock_openai.return_value.run.return_value = "Mock response"
    result = writer.write_content({"prompt": "test"})
    assert result == "Mock response"
```

## 持续集成

### GitHub Actions配置
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.12
    - name: Install dependencies
      run: pip install -r requirements.txt
    - name: Run tests
      run: pytest tests/ --cov=app
```

## 故障排除

### 常见测试问题
1. **数据库连接失败**
   ```bash
   # 检查测试数据库配置
   pytest tests/ -v -s
   ```

2. **Mock配置错误**
   ```python
   # 确保Mock路径正确
   @patch('app.api.run_prompt.write_content')
   ```

3. **异步测试问题**
   ```python
   # 使用pytest-asyncio
   @pytest.mark.asyncio
   async def test_async_function():
       result = await async_function()
       assert result is not None
   ```

### 调试技巧
- 使用 `pytest -v -s` 查看详细输出
- 使用 `pytest --pdb` 进入调试模式
- 使用 `print()` 或 `logging` 输出调试信息
