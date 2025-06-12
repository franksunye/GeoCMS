# 测试指南

## 测试策略

### 测试目标
1. **功能验证**
   - ✅ Prompt 处理流程
   - ✅ AI Agent 调用流程
   - ✅ 数据持久化
   - ✅ API 接口功能
   - ✅ 错误处理机制

2. **质量指标**
   - ✅ 测试覆盖率: 93%
   - ✅ 测试通过率: 100% (45/45)
   - ✅ API 响应时间: <1秒
   - ✅ 数据一致性: 100%

### 测试类型

#### 1. 单元测试（pytest）
- **API 测试**
  ```python
  def test_run_prompt_endpoint():
      response = client.post("/api/run-prompt", json={"prompt": "test prompt"})
      assert response.status_code == 200
      assert "content" in response.json()
  ```

- **数据库测试**
  ```python
  def test_save_prompt():
      prompt = Prompt(text="test prompt")
      db.add(prompt)
      db.commit()
      assert prompt.id is not None
  ```

- **LLM 调用测试**
  ```python
  def test_planner_agent():
      planner = Planner()
      result = planner.analyze("test prompt")
      assert result is not None
  ```

#### 2. 集成测试
- **端到端流程测试**
  ```python
  def test_full_flow():
      # 1. 发送 Prompt
      response = client.post("/api/run-prompt", json={"prompt": "test prompt"})
      assert response.status_code == 200
      
      # 2. 验证数据库
      prompt = db.query(Prompt).first()
      assert prompt.text == "test prompt"
      
      # 3. 验证生成内容
      content = db.query(ContentBlock).first()
      assert content is not None
  ```

- **Streamlit 界面测试**
  ```python
  def test_streamlit_ui():
      # 模拟用户输入
      prompt = "test prompt"
      result = process_prompt(prompt)
      assert result is not None
  ```

### 测试用例示例

#### API 测试
```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_run_prompt():
    response = client.post(
        "/api/run-prompt",
        json={"prompt": "test prompt"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "title" in data["content"]
```

#### 数据库测试
```python
from app.db.sqlite import get_db
from app.models.prompt import Prompt

def test_prompt_storage():
    db = next(get_db())
    prompt = Prompt(text="test prompt")
    db.add(prompt)
    db.commit()
    
    saved_prompt = db.query(Prompt).first()
    assert saved_prompt.text == "test prompt"
```

### 测试执行

```bash
# 运行所有测试
pytest tests/ -v

# 运行测试并查看覆盖率
pytest tests/ --cov=app --cov-report=term-missing

# 运行特定模块测试
pytest tests/unit/agents/ -v
pytest tests/integration/ -v
```

### 测试结果

```
========== 45 passed, 1 warning in 24.11s ==========

Name                     Stmts   Miss  Cover   Missing
------------------------------------------------------
app\__init__.py              3      0   100%
app\agents\planner.py       28      2    93%
app\agents\writer.py        54      6    89%
app\api\run_prompt.py       53      6    89%
app\db.py                   12      0   100%
app\main.py                  4      0   100%
app\mock_data.py            33      0   100%
app\models.py               19      0   100%
------------------------------------------------------
TOTAL                      206     14    93%
```

### 测试环境
- **开发环境**: SQLite + Mock LLM + 本地测试
- **CI/CD**: 自动化测试流程
- **集成测试**: 真实 API 调用（可选）