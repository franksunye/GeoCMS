# 前端开发文档

## 概述

GeoCMS 前端使用 Streamlit 构建，提供直观的用户界面用于内容生成和知识库管理。

## 技术栈

- **框架**: Streamlit 1.31.1
- **语言**: Python 3.12+
- **UI组件**: Streamlit 内置组件
- **状态管理**: st.session_state
- **HTTP客户端**: requests

## 应用架构

### 文件结构
```
frontend/
└── streamlit_app.py    # 主应用文件
```

### 页面结构
```
GeoCMS 应用
├── 侧边栏
│   ├── 页面导航
│   ├── 系统配置
│   └── 系统状态
├── 内容生成页面
│   ├── 提示词输入
│   ├── 智能生成按钮
│   └── 结果展示
└── 知识库管理页面
    ├── 知识列表
    ├── 添加知识
    └── 统计信息
```

## 核心功能

### 1. 页面导航系统

```python
# 页面路由配置
page_options = {
    "content_generation": "📝 内容生成",
    "knowledge_management": "🧠 知识库管理"
}

# 页面切换逻辑
selected_page = st.radio(
    "选择功能页面",
    options=list(page_options.keys()),
    format_func=lambda x: page_options[x]
)
```

### 2. 内容生成界面

#### 提示词输入
```python
prompt = st.text_area(
    "请输入您的创意或需求：",
    placeholder="例如：创建一个关于人工智能的专题页面",
    height=100
)
```

#### 智能生成处理
```python
if st.button("✨ 智能生成", type="primary"):
    with st.spinner("正在生成内容..."):
        response = requests.post(
            f"{api_url}/api/run-prompt",
            json={"prompt": prompt},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # 处理缺失知识情况
            if result.get("status") == "missing_knowledge":
                st.warning("⚠️ 检测到缺失必要知识信息")
                # 显示缺失知识提示
                
            else:
                # 显示生成结果
                st.success("✅ 内容生成成功！")
```

#### 缺失知识处理
```python
# 显示缺失知识信息
for missing in result.get('missing_knowledge', []):
    with st.expander(f"📋 {missing.get('description')}"):
        st.write(f"**主题**: {missing.get('topic')}")
        st.write(f"**描述**: {missing.get('description')}")
        
        # 一键跳转到知识管理
        if st.button(f"➕ 添加 {missing.get('topic')}", 
                    key=f"add_{missing.get('topic')}"):
            st.session_state.current_page = "knowledge_management"
            st.session_state['add_knowledge_topic'] = missing.get('topic')
            st.rerun()
```

### 3. 知识库管理界面

#### 标签页结构
```python
tab1, tab2, tab3 = st.tabs(["📋 知识列表", "➕ 添加知识", "📊 统计信息"])
```

#### 知识列表展示
```python
with tab1:
    knowledge_list = get_knowledge_list(api_url)
    
    for knowledge in knowledge_list:
        with st.expander(f"📚 {knowledge['topic']}"):
            col1, col2 = st.columns([3, 1])
            
            with col1:
                st.write(f"**主题**: {knowledge['topic']}")
                st.json(knowledge['content'])
            
            with col2:
                if st.button("🗑️ 删除", key=f"delete_{knowledge['id']}"):
                    delete_knowledge(api_url, knowledge['id'])
```

#### 知识添加表单
```python
with tab2:
    # 获取知识模板
    templates_data = get_knowledge_templates(api_url)
    
    # 选择知识类型
    selected_template = st.selectbox("选择知识类型", templates)
    
    # 动态表单生成
    if selected_template in template_details:
        template = template_details[selected_template]
        content = {}
        
        for field, default_value in template.items():
            if isinstance(default_value, list):
                # 列表字段处理
                list_items = st.text_area(f"{field} (每行一个项目)")
                content[field] = [item.strip() for item in list_items.split('\n')]
            else:
                # 普通字段处理
                content[field] = st.text_input(field, value=str(default_value))
```

### 4. 内容预览系统

#### 结构化内容渲染
```python
def render_content_preview(content: Any, content_type: str):
    if content_type == "structured" and isinstance(content, dict):
        # 显示标题
        if 'title' in content:
            st.markdown(f"# {content['title']}")
        
        # 显示章节
        headings = content.get('headings', [])
        paragraphs = content.get('paragraphs', [])
        
        for i, heading in enumerate(headings):
            st.markdown(f"## {heading}")
            if i < len(paragraphs):
                st.markdown(paragraphs[i])
        
        # 显示FAQ
        faqs = content.get('faqs', [])
        if faqs:
            st.markdown("## 常见问题")
            for faq in faqs:
                with st.expander(faq.get('question', '问题')):
                    st.markdown(faq.get('answer', '答案'))
```

#### HTML预览
```python
def render_structured_content(content: Dict[str, Any]) -> str:
    html = f"<h1>{content.get('title', '无标题')}</h1>\n"
    
    # 渲染标题和段落
    headings = content.get('headings', [])
    paragraphs = content.get('paragraphs', [])
    
    for i, heading in enumerate(headings):
        html += f"<h2>{heading}</h2>\n"
        if i < len(paragraphs):
            html += f"<p>{paragraphs[i]}</p>\n"
    
    return html

# 在组件中显示
st.components.v1.html(html_content, height=600, scrolling=True)
```

## 状态管理

### Session State 使用
```python
# 初始化状态
if 'current_page' not in st.session_state:
    st.session_state.current_page = "content_generation"
if 'api_url' not in st.session_state:
    st.session_state.api_url = "http://localhost:8000"

# 状态更新
if selected_page != st.session_state.current_page:
    st.session_state.current_page = selected_page
    st.rerun()
```

### 数据缓存
```python
@st.cache_data
def get_knowledge_templates(api_url: str):
    """缓存知识模板数据"""
    response = requests.get(f"{api_url}/api/knowledge/templates/list")
    return response.json()
```

## API 集成

### HTTP 请求处理
```python
def api_request(method: str, url: str, **kwargs):
    """统一的API请求处理"""
    try:
        response = requests.request(method, url, timeout=10, **kwargs)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"API请求失败: {response.status_code}")
            return None
    except requests.exceptions.Timeout:
        st.error("请求超时，请稍后重试")
        return None
    except requests.exceptions.ConnectionError:
        st.error("无法连接到API服务")
        return None
    except Exception as e:
        st.error(f"发生错误: {str(e)}")
        return None
```

### 错误处理
```python
# 统一错误处理
try:
    response = requests.post(api_url, json=data, timeout=30)
    if response.status_code == 200:
        st.success("操作成功")
    else:
        error_detail = response.json().get('detail', '未知错误')
        st.error(f"操作失败: {error_detail}")
except requests.exceptions.Timeout:
    st.error("请求超时，请稍后重试")
except requests.exceptions.ConnectionError:
    st.error("无法连接到API服务")
except Exception as e:
    st.error(f"发生错误: {str(e)}")
```

## 用户体验优化

### 加载状态
```python
with st.spinner("正在处理..."):
    # 长时间操作
    result = process_data()

# 进度条
progress_bar = st.progress(0)
for i in range(100):
    progress_bar.progress(i + 1)
```

### 用户反馈
```python
# 成功提示
st.success("✅ 操作成功完成")

# 警告提示
st.warning("⚠️ 检测到缺失知识信息")

# 错误提示
st.error("❌ 操作失败，请重试")

# 信息提示
st.info("💡 提示：请先添加相关知识")
```

### 响应式设计
```python
# 列布局
col1, col2 = st.columns([1, 2])
col1, col2, col3 = st.columns(3)

# 容器布局
with st.container():
    st.write("内容区域")

# 展开器
with st.expander("点击展开详细信息"):
    st.write("详细内容")
```

## 性能优化

### 缓存策略
```python
# 数据缓存
@st.cache_data(ttl=300)  # 5分钟缓存
def fetch_knowledge_list():
    return api_request("GET", "/api/knowledge")

# 资源缓存
@st.cache_resource
def init_api_client():
    return APIClient(base_url=api_url)
```

### 异步加载
```python
# 延迟加载
if st.button("加载更多"):
    with st.spinner("加载中..."):
        more_data = fetch_more_data()
        st.session_state.data.extend(more_data)
```

## 部署配置

### Streamlit 配置
```toml
# .streamlit/config.toml
[server]
port = 8501
address = "0.0.0.0"

[theme]
primaryColor = "#FF6B6B"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"

[browser]
gatherUsageStats = false
```

### 环境变量
```python
import os

# API配置
API_URL = os.getenv("API_URL", "http://localhost:8000")
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
```

## 测试策略

### 组件测试
```python
# 测试辅助函数
def test_render_content_preview():
    content = {"title": "测试标题", "paragraphs": ["测试段落"]}
    result = render_content_preview(content, "structured")
    assert result is not None

# 集成测试
def test_knowledge_management_flow():
    # 模拟用户操作流程
    pass
```

## 未来规划

### 技术升级
- 迁移到 React/Next.js
- 实现更丰富的交互组件
- 添加实时协作功能

### 功能扩展
- 拖拽式页面编辑器
- 实时预览功能
- 多主题支持
- 移动端适配
