# 前端开发指南

## PoC 阶段前端开发

### 技术栈
- Streamlit
- Python
- 状态管理：Streamlit Session State
- 数据可视化：Streamlit 内置组件

### 项目结构
```
frontend/
  ├── streamlit_app.py      # 主应用入口
  ├── components/           # 自定义组件
  │   ├── prompt_input.py   # Prompt 输入组件
  │   └── content_view.py   # 内容预览组件
  ├── utils/               # 工具函数
  │   ├── api.py          # API 调用
  │   └── formatters.py   # 数据格式化
  └── config.py           # 配置文件
```

### 核心功能实现

#### 1. Prompt 输入组件
```python
import streamlit as st

def prompt_input():
    prompt = st.text_area(
        "输入 Prompt",
        height=150,
        help="请输入您想要生成内容的 Prompt"
    )
    
    if st.button("生成内容"):
        if prompt:
            return prompt
        else:
            st.error("请输入 Prompt")
    return None
```

#### 2. 内容预览组件
```python
import streamlit as st
import json

def content_preview(content):
    # 显示 JSON 数据
    with st.expander("查看 JSON 数据"):
        st.json(content)
    
    # 渲染内容
    st.title(content["title"])
    
    for heading in content["headings"]:
        st.header(heading)
    
    for paragraph in content["paragraphs"]:
        st.write(paragraph)
    
    if content["faqs"]:
        st.subheader("常见问题")
        for faq in content["faqs"]:
            with st.expander(faq["question"]):
                st.write(faq["answer"])
```

### 页面布局
1. 输入区域
   - Prompt 输入框
   - 生成按钮
   - 加载状态显示

2. 预览区域
   - JSON 数据展示（可折叠）
   - 渲染结果展示
   - 错误信息显示

### 状态管理
1. 会话状态
   ```python
   if "content" not in st.session_state:
       st.session_state.content = None
   ```

2. 加载状态
   ```python
   if "loading" not in st.session_state:
       st.session_state.loading = False
   ```

### 错误处理
1. 输入验证
   - 必填检查
   - 格式验证

2. API 错误
   - 错误提示
   - 重试机制

### 性能优化
1. 缓存
   - 使用 `@st.cache_data` 缓存 API 响应
   - 使用 `@st.cache_resource` 缓存资源

2. 异步处理
   - 使用 `st.spinner` 显示加载状态
   - 异步 API 调用

## 后续规划
- 迁移到 React/Next.js
- 部署到 Vercel
- 完整的 UI 设计系统
- 响应式布局优化
- 主题定制
- 动画效果
- 可访问性优化 