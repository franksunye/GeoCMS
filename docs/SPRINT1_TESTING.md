# Sprint 1 测试指南 - Agent工作台

本文档说明如何测试Sprint 1实现的Agent工作台功能。

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows

# 启动FastAPI服务器
uvicorn app.main:app --reload --port 8000
```

后端服务将运行在 `http://localhost:8000`

### 2. 启动前端服务

```bash
# 进入前端目录
cd frontend-nextjs

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 `http://localhost:3000`

### 3. 配置环境变量

确保 `frontend-nextjs/.env.local` 文件包含：

```env
BACKEND_URL=http://localhost:8000
```

---

## 🧪 测试场景

### 场景1: 查看Agent工作台摘要

**目标**: 在概览页面查看活跃任务摘要

**步骤**:
1. 访问 `http://localhost:3000/dashboard`
2. 查看"Agent工作台"区域

**预期结果**:
- 如果有活跃任务，显示前5个任务卡片
- 每个卡片显示：
  - 任务名称（user_intent）
  - 创建时间
  - 运行状态徽章
  - 进度条和百分比
  - 当前执行的Agent和任务
- 底部显示统计信息（活跃/完成/失败数量）
- 如果没有活跃任务，显示空状态提示

**验证点**:
- ✅ 每3秒自动刷新
- ✅ 进度条动画流畅
- ✅ 状态徽章颜色正确（绿色=运行中）
- ✅ "查看全部"链接可点击

### 场景2: 访问任务监控页面

**目标**: 查看所有任务的详细信息

**步骤**:
1. 点击导航栏的"任务监控"
2. 或点击概览页"Agent工作台"的"查看全部"链接

**预期结果**:
- 页面标题显示"任务监控"
- 顶部显示4个统计卡片（总任务/活跃/已完成/失败）
- 筛选标签页（全部/活跃/已完成/失败）
- 任务列表按创建时间倒序排列

**验证点**:
- ✅ 统计数字正确
- ✅ 每3秒自动刷新
- ✅ 筛选功能正常工作

### 场景3: 查看任务详情

**目标**: 展开任务查看时间线

**步骤**:
1. 在任务监控页面，点击任意任务卡片
2. 查看展开的任务时间线

**预期结果**:
- 任务卡片展开，显示"任务时间线"
- 列出所有子任务，按时间顺序
- 每个子任务显示：
  - 状态图标（✅完成/🔄运行中/❌失败）
  - 任务类型（询问信息/生成内容/校验内容）
  - 状态徽章
  - 创建时间
  - 任务结果（如果有）

**验证点**:
- ✅ 展开/折叠动画流畅
- ✅ 任务状态图标正确
- ✅ 时间显示格式正确

### 场景4: 状态筛选

**目标**: 测试不同状态的筛选

**步骤**:
1. 在任务监控页面，点击"活跃"标签
2. 验证只显示活跃任务
3. 点击"已完成"标签
4. 验证只显示已完成任务
5. 点击"失败"标签
6. 验证只显示失败任务

**预期结果**:
- 筛选立即生效
- 显示的任务数量与标签上的数字一致
- 空状态时显示友好提示

**验证点**:
- ✅ 筛选逻辑正确
- ✅ URL参数更新
- ✅ 空状态提示清晰

### 场景5: 导航栏徽章

**目标**: 验证活跃任务数量徽章

**步骤**:
1. 查看导航栏的"任务监控"项
2. 如果有活跃任务，应该显示红色徽章

**预期结果**:
- 徽章显示活跃任务数量
- 徽章颜色为红色
- 每5秒自动更新

**验证点**:
- ✅ 徽章数字正确
- ✅ 自动更新
- ✅ 没有活跃任务时不显示徽章

---

## 🔧 创建测试数据

由于当前系统可能没有活跃的Agent任务，你可以通过以下方式创建测试数据：

### 方法1: 使用AI Native API

```bash
# 创建一个新的对话
curl -X POST http://localhost:8000/api/ai-native/conversations \
  -H "Content-Type: application/json" \
  -d '{"user_intent": "创建一个企业网站"}'
```

### 方法2: 直接插入数据库（开发环境）

```python
# 在Python shell中执行
from app.db import SessionLocal
from app.services.state_manager import get_state_manager

db = SessionLocal()
state_manager = get_state_manager(db)

# 创建测试运行
run = state_manager.create_run(
    user_intent="测试任务：创建企业网站",
    initial_state={
        "site_type": "企业官网",
        "brand_name": "测试公司",
        "target_audience": "企业客户",
        "content_goals": ["品牌展示", "产品介绍"],
        "pages": [],
        "current_page": None,
        "knowledge_context": {}
    }
)

print(f"创建了测试运行，ID: {run.id}")
db.close()
```

### 方法3: 使用Streamlit前端

```bash
# 启动Streamlit应用
streamlit run frontend/streamlit_app.py
```

然后在Streamlit界面中创建对话，这会自动创建PlannerRuns和Tasks。

---

## 🐛 常见问题

### 问题1: 前端显示"加载中..."但没有数据

**原因**: 后端服务未启动或连接失败

**解决方案**:
1. 检查后端服务是否运行：`curl http://localhost:8000/api/agent/runs`
2. 检查环境变量 `BACKEND_URL` 是否正确
3. 查看浏览器控制台的错误信息

### 问题2: 显示"没有找到任务"

**原因**: 数据库中没有PlannerRuns数据

**解决方案**:
1. 使用上述方法创建测试数据
2. 或者运行一次AI Native对话流程

### 问题3: 自动刷新不工作

**原因**: React Query配置问题

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 确认React Query Provider已正确配置
3. 检查网络请求是否正常（开发者工具 > Network）

### 问题4: 进度条显示0%

**原因**: StateManager的进度计算依赖槽位填充

**解决方案**:
1. 这是正常的，如果槽位还没有填充
2. 通过AI Native API提供用户输入来填充槽位
3. 进度会随着槽位填充自动更新

---

## 📊 API测试

### 测试后端API

```bash
# 1. 获取所有运行
curl http://localhost:8000/api/agent/runs

# 2. 获取活跃运行
curl http://localhost:8000/api/agent/runs?status=active

# 3. 获取单个运行详情
curl http://localhost:8000/api/agent/runs/1?include_tasks=true

# 4. 获取运行的任务
curl http://localhost:8000/api/agent/runs/1/tasks

# 5. 获取统计信息
curl http://localhost:8000/api/agent/stats

# 6. 更新运行状态
curl -X PATCH http://localhost:8000/api/agent/runs/1?status=completed
```

### 测试前端API Routes

```bash
# 1. 获取所有运行
curl http://localhost:3000/api/agent/runs

# 2. 获取活跃运行
curl http://localhost:3000/api/agent/runs?status=active

# 3. 获取单个运行详情
curl http://localhost:3000/api/agent/runs/1

# 4. 获取统计信息
curl http://localhost:3000/api/agent/stats
```

---

## ✅ 验收标准

Sprint 1的功能应满足以下标准：

### 功能性
- ✅ 能够显示所有运行列表
- ✅ 能够按状态筛选运行
- ✅ 能够查看单个运行的详细信息
- ✅ 能够查看任务时间线
- ✅ 进度条正确显示
- ✅ 实时自动刷新

### 性能
- ✅ 页面加载时间 < 2秒
- ✅ API响应时间 < 500ms
- ✅ 自动刷新不影响用户操作

### 用户体验
- ✅ 界面清晰直观
- ✅ 状态变化有视觉反馈
- ✅ 空状态有友好提示
- ✅ 加载状态有指示器
- ✅ 响应式设计（支持移动端）

### 代码质量
- ✅ TypeScript类型完整
- ✅ 错误处理完善
- ✅ 代码注释清晰
- ✅ 遵循项目规范

---

## 📝 测试报告模板

测试完成后，请填写以下报告：

```markdown
## Sprint 1 测试报告

**测试日期**: YYYY-MM-DD
**测试人员**: [姓名]
**环境**: 开发环境

### 测试结果

| 场景 | 状态 | 备注 |
|------|------|------|
| 场景1: Agent工作台摘要 | ✅/❌ | |
| 场景2: 任务监控页面 | ✅/❌ | |
| 场景3: 任务详情 | ✅/❌ | |
| 场景4: 状态筛选 | ✅/❌ | |
| 场景5: 导航栏徽章 | ✅/❌ | |

### 发现的问题

1. [问题描述]
   - 严重程度: 高/中/低
   - 复现步骤: ...
   - 预期结果: ...
   - 实际结果: ...

### 改进建议

1. [建议内容]

### 总体评价

[对Sprint 1功能的总体评价]
```

---

**最后更新**: 2025-01-23  
**维护者**: GeoCMS Team

