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
│   │   └── test_knowledge.py    # 知识库API测试
│   ├── agents/             # Agent层测试
│   │   ├── test_planner.py     # 包含知识感知测试
│   │   └── test_writer.py      # 包含上下文注入测试
│   ├── services/           # 服务层测试
│   │   └── test_knowledge.py   # 知识库服务测试
│   └── models/             # 模型测试
└── integration/            # 集成测试
    ├── test_agents_integration.py
    ├── test_flow.py
    └── test_prompt.py
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

### 当前测试状态（v1.0.0）
```
========== 98 passed, 2 warnings in 25.68s ==========

测试分布：
- 单元测试：87个
  - API测试：20个（包含11个知识库API测试）
  - Agent测试：37个（包含5个知识感知测试）
  - 服务测试：18个（知识库服务测试）
  - 模型测试：3个
  - 其他：9个
- 集成测试：11个

新增知识库相关测试：34个
原有功能测试：64个
```

### 覆盖率报告
```
Name                           Stmts   Miss  Cover
--------------------------------------------------
app/__init__.py                    3      0   100%
app/agents/planner.py             45      2    96%
app/agents/writer.py              67      3    96%
app/api/knowledge.py              89      4    96%
app/api/run_prompt.py             58      3    95%
app/services/knowledge.py         78      2    97%
app/models.py                     25      0   100%
app/db.py                         15      0   100%
app/main.py                        8      0   100%
--------------------------------------------------
TOTAL                            388     14    96%
```

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
