# 开发指南

## 环境设置

### 开发环境要求
- Python 3.12+
- SQLite（开发）/ PostgreSQL（生产）
- OpenAI API 密钥（可选，有Mock回退）
- Git 版本控制

### 项目初始化
```bash
# 克隆项目
git clone https://github.com/franksunye/GeoCMS.git
cd GeoCMS

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn app.main:app --reload

# 启动前端（新终端）
streamlit run frontend/streamlit_app.py
```

### 配置文件
```bash
# .env（可选）
OPENAI_API_KEY=your_api_key
ENVIRONMENT=development
```

## 开发流程

### 分支管理
- `master`: 主分支，稳定版本
- `feature/*`: 功能分支，如 `feature/knowledge-base`
- 使用Pull Request进行代码审查

### 提交规范（Conventional Commits）
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具
```

示例：
```bash
git commit -m "feat: 🧠 add knowledge base system"
git commit -m "fix: resolve API response format issue"
git commit -m "docs: update architecture documentation"
```

## 代码规范

### 后端开发（Python + FastAPI）

#### 项目结构
```
app/
├── api/           # API路由
├── agents/        # AI代理
├── services/      # 业务服务
├── models.py      # 数据模型
├── db.py         # 数据库配置
└── main.py       # 应用入口
```

#### 编码规范
- 使用类型注解
- 遵循 PEP 8 规范
- 使用 pydantic 模型验证
- 实现完整的错误处理
- 添加详细的文档字符串

#### 示例代码
```python
from typing import Dict, Any, Optional
from pydantic import BaseModel

class KnowledgeCreate(BaseModel):
    topic: str
    content: Dict[str, Any]
    description: Optional[str] = None

def create_knowledge(
    knowledge_data: KnowledgeCreate,
    db: Session = Depends(get_db)
) -> KnowledgeResponse:
    """
    创建新的知识条目
    
    Args:
        knowledge_data: 知识数据
        db: 数据库会话
        
    Returns:
        创建的知识条目
        
    Raises:
        HTTPException: 创建失败时
    """
    # 实现逻辑
```

### 前端开发（Streamlit）

#### 组件化开发
```python
def render_knowledge_management_page(api_url: str):
    """渲染知识库管理页面"""
    # 页面逻辑

def render_content_generation_page(api_url: str):
    """渲染内容生成页面"""
    # 页面逻辑
```

#### 状态管理
- 使用 `st.session_state` 管理应用状态
- 合理使用缓存 `@st.cache_data`
- 实现错误处理和用户反馈

## 测试策略

### 测试结构
```
tests/
├── unit/          # 单元测试
│   ├── api/       # API测试
│   ├── agents/    # Agent测试
│   └── services/  # 服务测试
└── integration/   # 集成测试
```

### 运行测试
```bash
# 运行所有测试
pytest tests/ -v

# 运行特定测试
pytest tests/unit/api/test_knowledge.py -v

# 查看覆盖率
pytest tests/ --cov=app --cov-report=term-missing

# 快速测试
pytest tests/ --tb=no -q
```

### 测试编写规范
```python
def test_create_knowledge():
    """测试创建知识功能"""
    # Arrange
    knowledge_data = {...}
    
    # Act
    response = client.post("/api/knowledge", json=knowledge_data)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["topic"] == knowledge_data["topic"]
```

## 数据库管理

### 模型定义
```python
class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)  # JSON格式
    description = Column(Text)
    created_at = Column(DateTime, default=timezone.utc)
    updated_at = Column(DateTime, default=timezone.utc)
```

### 数据库操作
- 使用SQLAlchemy ORM
- 实现事务管理
- 添加索引优化查询
- 使用连接池

## 调试和日志

### 日志配置
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

### 调试技巧
- 使用FastAPI的自动文档：`http://localhost:8000/docs`
- 使用pytest的详细输出：`pytest -v -s`
- 使用Streamlit的调试模式

## 性能优化

### 后端优化
- 数据库查询优化
- 使用异步处理
- 实现缓存机制
- API响应压缩

### 前端优化
- 使用Streamlit缓存
- 优化组件渲染
- 减少API调用

## 部署准备

### 环境配置
```bash
# 生产环境依赖
pip install -r requirements.txt

# 环境变量
export OPENAI_API_KEY=your_key
export ENVIRONMENT=production
```

### Docker化（规划中）
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 代码审查
6. 合并到主分支

### 代码审查要点
- 功能完整性
- 测试覆盖率
- 代码质量
- 文档完整性
- 性能影响

## 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查数据库文件权限
   - 验证连接字符串

2. **API调用失败**
   - 检查服务是否启动
   - 验证端口配置

3. **测试失败**
   - 检查依赖安装
   - 清理测试数据

### 获取帮助
- 查看项目文档
- 检查GitHub Issues
- 联系项目维护者
