# 测试指南

## PoC 阶段测试策略

### 测试目标
1. 验证核心功能
   - Prompt 处理流程
   - LLM 调用流程
   - 数据持久化
   - 前端展示

2. 性能指标
   - 响应时间 ≤10 秒
   - 成功率 >90%
   - 数据一致性 100%

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

### 测试报告
- 测试覆盖率报告（pytest-cov）
- 性能测试报告
- 错误日志分析

### 测试环境
1. 开发环境
   - 使用 SQLite 内存数据库
   - 模拟 LLM 响应
   - 本地 Streamlit 测试

2. 测试环境
   - 独立的测试数据库
   - 真实的 LLM 调用
   - 完整的端到端测试

## 后续测试规划
- 自动化测试流程
- 性能基准测试
- 安全测试
- 负载测试
- 迁移测试（SQLite → PostgreSQL） 