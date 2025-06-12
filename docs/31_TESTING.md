### 测试类型

- **单元测试**：验证各个组件的独立功能
- **集成测试**：验证组件间的交互
- **端到端测试**：验证完整业务流程

### 测试工具

- **pytest**: 测试框架
- **pytest-cov**: 覆盖率统计
- **pytest-mock**: Mock工具

### 测试数据

- **Mock数据**: 用于模拟外部依赖
- **测试数据库**: 用于数据持久化测试

### 持续集成

- **GitHub Actions**: 自动运行测试
- **覆盖率报告**: 自动生成并上传

### 测试维护

- 定期更新测试用例
- 保持测试数据的有效性
- 及时修复失败的测试

---

# 测试指南（2024最新版）

## 测试策略

### 目标
- **功能验证**：所有核心业务、API、异常分支均有自动化测试
- **敏捷保障**：每次提交/重构/上线前，均可一键全量回归，确保无回归风险
- **覆盖率目标**：100%（已达成）

### 测试分层
- **单元测试**（tests/unit/）：mock依赖，聚焦函数/类内部逻辑
- **集成测试**（tests/integration/）：真实依赖，验证API、业务链路、端到端流程

### 主要测试命令
```bash
# 运行所有测试
pytest tests/ -v

# 运行并查看覆盖率（推荐每次提交前执行）
pytest tests/ --cov=app --cov-report=term-missing

# 只跑集成测试
pytest tests/integration/ -v

# 只跑单元测试
pytest tests/unit/ -v
```

### 最新测试结果（2024年6月）
```
============================================
全部通过：64/64
覆盖率：100%

Name                     Stmts   Miss  Cover
------------------------------------------------------
app/__init__.py              3      0   100%
app/agents/__init__.py       0      0   100%
app/agents/planner.py       28      0   100%
app/agents/writer.py        54      0   100%
app/api/__init__.py          0      0   100%
app/api/run_prompt.py       53      0   100%
app/db.py                   12      0   100%
app/main.py                  4      0   100%
app/mock_data.py            33      0   100%
app/models.py               19      0   100%
------------------------------------------------------
TOTAL                      206      0   100%
============================================
```

### 敏捷实践建议
- **每次开发/重构/合并前，务必全量跑测试，确保100%通过**
- **如有新功能/分支/异常分支，务必补充测试，保持100%覆盖**
- **推荐在CI/CD中集成pytest+coverage，自动阻断未通过或覆盖率下降的提交**

---
如需补充测试用例、优化测试结构或集成CI，请联系开发负责人或AI助手。

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