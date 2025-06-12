import streamlit as st
import requests
import json
from typing import Dict, Any

# 页面配置
st.set_page_config(
    page_title="GeoCMS - AI驱动的智能建站系统",
    page_icon="🌍",
    layout="wide"
)

def render_structured_content(content: Dict[str, Any]) -> str:
    """将结构化内容渲染为HTML"""
    html = f"<h1>{content.get('title', '无标题')}</h1>\n"

    # 渲染标题和段落
    headings = content.get('headings', [])
    paragraphs = content.get('paragraphs', [])

    for i, heading in enumerate(headings):
        html += f"<h2>{heading}</h2>\n"
        if i < len(paragraphs):
            html += f"<p>{paragraphs[i]}</p>\n"

    # 渲染FAQ
    faqs = content.get('faqs', [])
    if faqs:
        html += "<h2>常见问题</h2>\n"
        for faq in faqs:
            html += f"<h3>{faq.get('question', '')}</h3>\n"
            html += f"<p>{faq.get('answer', '')}</p>\n"

    return html

def render_content_preview(content: Any, content_type: str):
    """渲染内容预览"""
    if content_type == "structured" and isinstance(content, dict):
        # 结构化内容预览
        st.subheader("📄 内容预览")

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

        # 网页预览
        st.subheader("🌐 网页预览")
        html_content = render_structured_content(content)
        st.components.v1.html(html_content, height=600, scrolling=True)

    else:
        # 文本内容预览
        st.subheader("📝 生成内容")
        st.markdown(str(content))

# 主界面
st.title("🌍 GeoCMS - AI驱动的智能建站系统")
st.markdown("基于大语言模型的智能内容生成与管理系统")

# 侧边栏
with st.sidebar:
    st.header("⚙️ 系统配置")
    api_url = st.text_input("API服务地址", value="http://localhost:8000")
    st.markdown("---")
    st.header("📊 系统状态")

    # 检查API状态
    try:
        health_response = requests.get(f"{api_url}/docs", timeout=2)
        if health_response.status_code == 200:
            st.success("✅ API服务正常")
        else:
            st.error("❌ API服务异常")
    except:
        st.error("❌ 无法连接API服务")

# 主要内容区域
col1, col2 = st.columns([1, 2])

with col1:
    st.header("📝 内容生成")

    # 提示词输入
    prompt = st.text_area(
        "请输入您的创意或需求：",
        placeholder="例如：创建一个关于人工智能的专题页面，包含技术介绍、应用案例和未来展望",
        height=100
    )

    # 生成按钮
    if st.button("✨ 智能生成", type="primary"):
        if not prompt.strip():
            st.error("请输入提示词")
        else:
            with st.spinner("正在生成内容..."):
                try:
                    # 调用API
                    response = requests.post(
                        f"{api_url}/run-prompt",
                        json={"prompt": prompt},
                        timeout=30
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.session_state['last_result'] = result
                        st.success("✅ 内容生成成功！")
                    else:
                        st.error(f"❌ 生成失败：{response.json().get('detail', '未知错误')}")

                except requests.exceptions.Timeout:
                    st.error("❌ 请求超时，请稍后重试")
                except requests.exceptions.ConnectionError:
                    st.error("❌ 无法连接到API服务")
                except Exception as e:
                    st.error(f"❌ 发生错误：{str(e)}")

with col2:
    st.header("📋 生成结果")

    # 显示生成结果
    if 'last_result' in st.session_state:
        result = st.session_state['last_result']

        # 显示元数据
        with st.expander("📊 生成信息"):
            st.json({
                "ID": result.get('id'),
                "Prompt ID": result.get('prompt_id'),
                "内容类型": result.get('content_type'),
                "生成时间": result.get('created_at')
            })

        # 渲染内容
        render_content_preview(
            result.get('content'),
            result.get('content_type', 'text')
        )
    else:
        st.info("👆 请在左侧输入提示词并点击生成按钮")

# 页脚
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>GeoCMS v1.0 | 由 FastAPI + Streamlit + LangChain 驱动的下一代智能建站系统</p>
    </div>
    """,
    unsafe_allow_html=True
)