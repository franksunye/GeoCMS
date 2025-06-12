import streamlit as st
import requests
import json
from typing import Dict, Any, List
from datetime import datetime

# 页面配置
st.set_page_config(
    page_title="GeoCMS - AI驱动的智能建站系统",
    page_icon="🌍",
    layout="wide"
)

# 初始化session state
if 'current_page' not in st.session_state:
    st.session_state.current_page = "content_generation"
if 'api_url' not in st.session_state:
    st.session_state.api_url = "http://localhost:8000"

# 知识库管理函数
def get_knowledge_list(api_url: str) -> List[Dict[str, Any]]:
    """获取知识库列表"""
    try:
        response = requests.get(f"{api_url}/api/knowledge", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"获取知识库失败: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"连接失败: {str(e)}")
        return []

def get_knowledge_templates(api_url: str) -> Dict[str, Any]:
    """获取知识模板"""
    try:
        response = requests.get(f"{api_url}/api/knowledge/templates/list", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            return {"templates": [], "details": {}}
    except Exception as e:
        st.error(f"获取模板失败: {str(e)}")
        return {"templates": [], "details": {}}

def create_knowledge(api_url: str, topic: str, content: Dict[str, Any], description: str = None) -> bool:
    """创建知识条目"""
    try:
        data = {
            "topic": topic,
            "content": content,
            "description": description
        }
        response = requests.post(f"{api_url}/api/knowledge", json=data, timeout=10)
        if response.status_code == 200:
            st.success("知识创建成功！")
            return True
        else:
            st.error(f"创建失败: {response.json().get('detail', '未知错误')}")
            return False
    except Exception as e:
        st.error(f"创建失败: {str(e)}")
        return False

def delete_knowledge(api_url: str, knowledge_id: int) -> bool:
    """删除知识条目"""
    try:
        response = requests.delete(f"{api_url}/api/knowledge/{knowledge_id}", timeout=10)
        if response.status_code == 200:
            st.success("知识删除成功！")
            return True
        else:
            st.error(f"删除失败: {response.json().get('detail', '未知错误')}")
            return False
    except Exception as e:
        st.error(f"删除失败: {str(e)}")
        return False

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
    st.header("📋 页面导航")
    page_options = {
        "content_generation": "📝 内容生成",
        "knowledge_management": "🧠 知识库管理"
    }

    # 确保session_state已初始化
    current_page = st.session_state.get('current_page', 'content_generation')

    selected_page = st.radio(
        "选择功能页面",
        options=list(page_options.keys()),
        format_func=lambda x: page_options[x],
        index=0 if current_page == "content_generation" else 1
    )

    if selected_page != current_page:
        st.session_state.current_page = selected_page
        st.rerun()

    st.markdown("---")
    st.header("⚙️ 系统配置")
    api_url = st.text_input("API服务地址", value=st.session_state.get('api_url', 'http://localhost:8000'))
    if api_url != st.session_state.get('api_url', 'http://localhost:8000'):
        st.session_state.api_url = api_url

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

def render_content_generation_page(api_url: str):
    """渲染内容生成页面"""
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
                            f"{api_url}/api/run-prompt",
                            json={"prompt": prompt},
                            timeout=30
                        )

                        if response.status_code == 200:
                            result = response.json()

                            # 检查是否是缺失知识的响应
                            if result.get("status") == "missing_knowledge":
                                st.warning("⚠️ 检测到缺失必要知识信息")
                                st.session_state['missing_knowledge'] = result.get('missing_knowledge', [])

                                # 显示缺失知识信息
                                st.subheader("🔍 需要补充的知识")
                                for missing in result.get('missing_knowledge', []):
                                    with st.expander(f"📋 {missing.get('description', missing.get('topic', '未知'))}"):
                                        st.write(f"**主题**: {missing.get('topic', '未知')}")
                                        st.write(f"**描述**: {missing.get('description', '无描述')}")
                                        if missing.get('suggested_fields'):
                                            st.write("**建议字段**:")
                                            for field in missing['suggested_fields']:
                                                st.write(f"- {field}")

                                        if st.button(f"➕ 添加 {missing.get('topic', '知识')}", key=f"add_{missing.get('topic')}"):
                                            st.session_state.current_page = "knowledge_management"
                                            st.session_state['add_knowledge_topic'] = missing.get('topic')
                                            st.rerun()
                            else:
                                # 正常生成内容
                                st.session_state['last_result'] = result
                                st.success("✅ 内容生成成功！")

                                # 显示使用的知识
                                if result.get('knowledge_used'):
                                    st.info(f"📚 使用了知识: {', '.join(result['knowledge_used'])}")
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
                    "生成时间": result.get('created_at'),
                    "使用的知识": result.get('knowledge_used', [])
                })

            # 渲染内容
            render_content_preview(
                result.get('content'),
                result.get('content_type', 'text')
            )
        else:
            st.info("👆 请在左侧输入提示词并点击生成按钮")

def render_knowledge_management_page(api_url: str):
    """渲染知识库管理页面"""
    st.header("🧠 知识库管理")

    # 创建标签页
    tab1, tab2, tab3 = st.tabs(["📋 知识列表", "➕ 添加知识", "📊 统计信息"])

    with tab1:
        st.subheader("📋 现有知识")

        # 获取知识列表
        knowledge_list = get_knowledge_list(api_url)

        if knowledge_list:
            for knowledge in knowledge_list:
                with st.expander(f"📚 {knowledge['topic']} - {knowledge.get('description', '无描述')}"):
                    col1, col2 = st.columns([3, 1])

                    with col1:
                        st.write(f"**主题**: {knowledge['topic']}")
                        st.write(f"**描述**: {knowledge.get('description', '无描述')}")
                        st.write(f"**创建时间**: {knowledge['created_at']}")
                        st.write(f"**更新时间**: {knowledge['updated_at']}")

                        # 显示内容
                        st.write("**内容**:")
                        st.json(knowledge['content'])

                    with col2:
                        if st.button("🗑️ 删除", key=f"delete_{knowledge['id']}"):
                            if delete_knowledge(api_url, knowledge['id']):
                                st.rerun()
        else:
            st.info("📝 暂无知识条目，请添加一些知识来开始使用。")

    with tab2:
        st.subheader("➕ 添加新知识")

        # 获取知识模板
        templates_data = get_knowledge_templates(api_url)
        templates = templates_data.get('templates', [])
        template_details = templates_data.get('details', {})

        # 检查是否有预设的主题（来自缺失知识检测）
        default_topic = st.session_state.get('add_knowledge_topic', '')
        if default_topic and default_topic in templates:
            default_index = templates.index(default_topic)
        else:
            default_index = 0

        # 选择知识类型
        if templates:
            selected_template = st.selectbox(
                "选择知识类型",
                options=templates,
                index=default_index,
                format_func=lambda x: f"{x} - {template_details.get(x, {}).get('name', x) if isinstance(template_details.get(x), dict) else x}"
            )
        else:
            selected_template = st.text_input("知识主题", value=default_topic)

        # 清除预设主题
        if 'add_knowledge_topic' in st.session_state:
            del st.session_state['add_knowledge_topic']

        # 知识描述
        description = st.text_input("知识描述", placeholder="简要描述这个知识的用途")

        # 根据模板显示表单
        if selected_template and selected_template in template_details:
            template = template_details[selected_template]
            st.write(f"**{selected_template}** 模板字段:")

            content = {}
            for field, default_value in template.items():
                if isinstance(default_value, list):
                    # 列表字段
                    st.write(f"**{field}**:")
                    list_items = st.text_area(
                        f"{field} (每行一个项目)",
                        placeholder="\n".join(default_value) if default_value else "请输入项目，每行一个",
                        key=f"field_{field}"
                    )
                    content[field] = [item.strip() for item in list_items.split('\n') if item.strip()]
                else:
                    # 普通字段
                    content[field] = st.text_input(
                        field,
                        value=str(default_value) if default_value else "",
                        key=f"field_{field}"
                    )
        else:
            # 自定义内容
            st.write("自定义知识内容 (JSON格式):")
            content_text = st.text_area(
                "内容",
                placeholder='{"key": "value", "list": ["item1", "item2"]}',
                height=200
            )

            try:
                content = json.loads(content_text) if content_text.strip() else {}
            except json.JSONDecodeError:
                st.error("❌ JSON格式错误，请检查语法")
                content = {}

        # 添加按钮
        if st.button("💾 保存知识", type="primary"):
            if not selected_template:
                st.error("请输入知识主题")
            elif not content:
                st.error("请填写知识内容")
            else:
                if create_knowledge(api_url, selected_template, content, description):
                    st.rerun()

    with tab3:
        st.subheader("📊 知识库统计")

        try:
            response = requests.get(f"{api_url}/api/knowledge/stats/summary", timeout=10)
            if response.status_code == 200:
                stats = response.json()

                col1, col2, col3 = st.columns(3)

                with col1:
                    st.metric("总知识条目", stats.get('total_knowledge', 0))

                with col2:
                    st.metric("可用模板", len(stats.get('available_templates', [])))

                with col3:
                    topic_counts = stats.get('topic_counts', {})
                    most_common = max(topic_counts.items(), key=lambda x: x[1]) if topic_counts else ("无", 0)
                    st.metric("最多类型", f"{most_common[0]} ({most_common[1]})")

                # 显示各类型分布
                if topic_counts:
                    st.subheader("📈 知识类型分布")
                    st.bar_chart(topic_counts)

                # 显示可用模板
                st.subheader("📋 可用模板")
                for template in stats.get('available_templates', []):
                    st.write(f"- {template}")
            else:
                st.error("获取统计信息失败")
        except Exception as e:
            st.error(f"获取统计信息失败: {str(e)}")

# 页面路由
current_page = st.session_state.get('current_page', 'content_generation')
if current_page == "content_generation":
    render_content_generation_page(api_url)
elif current_page == "knowledge_management":
    render_knowledge_management_page(api_url)

# 页脚
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>GeoCMS v1.0 | 由 FastAPI + Streamlit + LangChain 驱动的下一代智能建站系统</p>
        <p>🧠 现已支持知识库感知的智能内容生成</p>
    </div>
    """,
    unsafe_allow_html=True
)