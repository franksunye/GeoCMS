import streamlit as st
import requests
import json
import logging
from typing import Dict, Any, List
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 页面配置
st.set_page_config(
    page_title="GeoCMS",
    page_icon="🌍",
    layout="wide"
)

# 自定义CSS样式
st.markdown("""
<style>
    /* 全局样式 */
    .stApp {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }
    
    /* 标题样式 */
    h1 {
        font-size: 32px !important;
        font-weight: 700 !important;
        margin-bottom: 1.5rem !important;
    }
    
    h2 {
        font-size: 24px !important;
        font-weight: 600 !important;
        margin-bottom: 1rem !important;
    }
    
    h3 {
        font-size: 20px !important;
        font-weight: 600 !important;
        margin-bottom: 0.75rem !important;
    }
    
    /* 正文样式 */
    p, .stMarkdown {
        font-size: 16px !important;
        line-height: 1.6 !important;
    }
    
    /* 卡片容器样式 */
    .card {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    /* 输入框样式 */
    .stTextArea textarea {
        font-size: 16px !important;
        line-height: 1.6 !important;
    }
    
    /* 按钮样式 */
    .stButton button {
        font-size: 16px !important;
        font-weight: 500 !important;
    }
    
    /* 侧边栏样式 */
    .css-1d391kg {
        padding: 1rem;
    }
    
    /* 标签页样式 */
    .stTabs [data-baseweb="tab-list"] {
        gap: 2rem;
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: #f8f9fa;
        border-radius: 4px 4px 0 0;
        gap: 1rem;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: #ffffff;
    }
</style>
""", unsafe_allow_html=True)

# 初始化session state
if 'current_page' not in st.session_state:
    st.session_state.current_page = "ai_native_chat"
if 'api_url' not in st.session_state:
    st.session_state.api_url = "http://localhost:8000"
if 'conversation_history' not in st.session_state:
    st.session_state.conversation_history = []
if 'current_run_id' not in st.session_state:
    st.session_state.current_run_id = None
if 'conversation_state' not in st.session_state:
    st.session_state.conversation_state = None

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
        # 创建标签页
        preview_tab, web_tab = st.tabs(["内容预览", "网页预览"])

        with preview_tab:
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

        with web_tab:
            html_content = render_structured_content(content)
            st.components.v1.html(html_content, height=600, scrolling=True)
    else:
        # 文本内容预览
        st.markdown(str(content))

# AI Native 对话功能
def start_ai_conversation(api_url: str, user_intent: str) -> Dict[str, Any]:
    """开始AI Native对话"""
    try:
        logger.info(f"开始AI对话，用户意图: {user_intent}")
        if not user_intent.strip():
            return {"error": "请输入您的意图"}

        response = requests.post(
            f"{api_url}/api/ai-native/conversations",
            json={"user_intent": user_intent},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            logger.info(f"API返回成功: {result}")
            return result
        else:
            error_msg = f"启动对话失败: {response.status_code}"
            try:
                error_detail = response.json().get("detail", "")
                if error_detail:
                    error_msg += f" - {error_detail}"
            except:
                pass
            logger.error(f"API调用失败: {error_msg}")
            return {"error": error_msg}
    except requests.exceptions.ConnectionError:
        logger.error("无法连接到API服务")
        return {"error": "无法连接到API服务，请确保后端服务正在运行"}
    except requests.exceptions.Timeout:
        logger.error("请求超时")
        return {"error": "请求超时，请稍后重试"}
    except Exception as e:
        logger.error(f"发生异常: {str(e)}")
        return {"error": f"发生错误: {str(e)}"}

def process_user_input(api_url: str, run_id: int, user_input: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """处理用户输入"""
    try:
        data = {"user_input": user_input}
        if context:
            data["context"] = context

        response = requests.post(
            f"{api_url}/api/ai-native/conversations/{run_id}/input",
            json=data,
            timeout=30
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"处理输入失败: {response.status_code}"}
    except Exception as e:
        return {"error": f"连接失败: {str(e)}"}

def get_conversation_status(api_url: str, run_id: int) -> Dict[str, Any]:
    """获取对话状态"""
    try:
        response = requests.get(
            f"{api_url}/api/ai-native/conversations/{run_id}/status",
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"获取状态失败: {response.status_code}"}
    except Exception as e:
        return {"error": f"连接失败: {str(e)}"}

def generate_content_ai_native(api_url: str, run_id: int, task_data: Dict[str, Any]) -> Dict[str, Any]:
    """AI Native内容生成"""
    try:
        response = requests.post(
            f"{api_url}/api/ai-native/conversations/{run_id}/generate",
            json={"task_data": task_data},
            timeout=30
        )
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"内容生成失败: {response.status_code}"}
    except Exception as e:
        return {"error": f"连接失败: {str(e)}"}

def render_conversation_message(message: Dict[str, Any], is_user: bool = True):
    """渲染对话消息"""
    # 确保content不为None或字符串"None"
    content = message.get('content', '')
    logger.info(f"渲染消息 - 原始content: {repr(content)}, is_user: {is_user}")
    if content is None or content == "None" or str(content).strip() == "None":
        content = ''
        logger.warning(f"Content为None或'None'，已替换为空字符串。原始值: {repr(content)}")

    if is_user:
        st.markdown(f"""
        <div style="background-color: #e3f2fd; padding: 10px; border-radius: 10px; margin: 5px 0; margin-left: 20%;">
            <strong>您:</strong> {content}
        </div>
        """, unsafe_allow_html=True)
    else:
        logger.info(f"渲染AI助手消息: {repr(content)}")
        st.markdown(f"""
        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 10px; margin: 5px 0; margin-right: 20%;">
            <strong>AI助手:</strong> {content}
        </div>
        """, unsafe_allow_html=True)

def render_slot_input_form(next_action: Dict[str, Any], api_url: str, run_id: int):
    """渲染槽位输入表单"""
    slot_name = next_action.get('slot_name', '')
    prompt = next_action.get('prompt', '')
    options = next_action.get('options', [])

    logger.info(f"渲染槽位表单 - slot_name: {slot_name}, 原始prompt: {repr(prompt)}")

    # 确保prompt不为None或字符串"None"
    if prompt is None or prompt == "None" or str(prompt).strip() == "None":
        prompt = "请提供更多信息"
        logger.warning(f"槽位表单prompt为None或'None'，已替换为默认值。原始值: {repr(prompt)}")

    logger.info(f"最终显示的prompt: {repr(prompt)}")

    st.markdown(f"**{prompt}**")

    if options:
        # 有选项的情况，使用选择框
        user_input = st.selectbox(
            "请选择:",
            options=options,
            key=f"slot_input_{slot_name}"
        )

        if st.button("确认选择", key=f"confirm_{slot_name}"):
            return user_input
    else:
        # 没有选项的情况，使用文本输入
        user_input = st.text_input(
            "请输入:",
            key=f"slot_input_{slot_name}",
            placeholder="请输入您的回答"
        )

        if st.button("提交", key=f"submit_{slot_name}") and user_input.strip():
            return user_input

    return None

def render_ai_native_chat_page(api_url: str):
    """渲染AI Native对话页面"""
    st.header("🤖 AI Native 智能对话")
    st.markdown("通过多轮对话，AI助手将引导您完成网站内容的创建过程。")

    # 对话控制区域
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        if st.button("🆕 开始新对话", type="primary"):
            logger.info("点击开始新对话按钮，清理session state")
            st.session_state.conversation_history = []
            st.session_state.current_run_id = None
            st.session_state.conversation_state = None
            st.rerun()

    with col2:
        if st.session_state.current_run_id:
            if st.button("📊 查看状态"):
                status = get_conversation_status(api_url, st.session_state.current_run_id)
                if "error" not in status:
                    st.session_state.conversation_state = status

    with col3:
        if st.session_state.current_run_id:
            if st.button("✅ 完成对话"):
                try:
                    response = requests.post(
                        f"{api_url}/api/ai-native/conversations/{st.session_state.current_run_id}/complete"
                    )
                    if response.status_code == 200:
                        st.success("对话已完成！")
                        st.session_state.current_run_id = None
                        st.session_state.conversation_state = None
                except:
                    st.error("完成对话失败")

    # 显示对话状态
    if st.session_state.conversation_state:
        with st.expander("📊 对话状态详情"):
            state = st.session_state.conversation_state

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("对话ID", state.get('run_id', 'N/A'))
            with col2:
                st.metric("状态", state.get('status', 'N/A'))
            with col3:
                progress = state.get('progress', 0)
                st.metric("进度", f"{progress:.1%}")

            # 显示当前状态
            st.subheader("当前状态")
            current_state = state.get('current_state', {})
            for key, value in current_state.items():
                if value is not None:
                    st.write(f"**{key}**: {value}")

            # 显示任务历史
            tasks = state.get('tasks', [])
            if tasks:
                st.subheader("任务历史")
                for task in tasks:
                    status_icon = "✅" if task['status'] == 'completed' else "⏳" if task['status'] == 'pending' else "❌"
                    st.write(f"{status_icon} {task['type']} - {task['status']}")

    # 主对话区域
    st.markdown("---")

    # 如果没有活跃对话，显示开始界面
    if not st.session_state.current_run_id:
        st.subheader("开始新的对话")
        user_intent = st.text_input(
            "请描述您想要创建的网站:",
            placeholder="例如：我想创建一个企业官网，展示我们公司的产品和服务",
            key="initial_intent"
        )

        # 分离按钮点击和输入验证
        button_clicked = st.button("开始对话", key="start_conversation")

        if button_clicked:
            logger.info(f"按钮被点击，用户输入: {repr(user_intent)}")
            if not user_intent.strip():
                st.error("请输入您的意图")
                logger.warning("用户输入为空")
            else:
                logger.info("开始调用API")
                with st.spinner("正在启动AI助手..."):
                    result = start_ai_conversation(api_url, user_intent)

                    if "error" in result:
                        st.error(result["error"])
                    else:
                        st.session_state.current_run_id = result["run_id"]
                        st.session_state.conversation_history.append({
                            "type": "user",
                            "content": user_intent
                        })

                        # 处理第一个响应
                        next_action = result.get("next_action", {})
                        logger.info(f"处理第一个响应 - next_action: {next_action}")
                        if next_action.get("action") == "ask_slot":
                            prompt_text = next_action.get("prompt", "")
                            logger.info(f"获取到的prompt_text: {repr(prompt_text)}")
                            if prompt_text is None or prompt_text == "None" or str(prompt_text).strip() == "None":
                                prompt_text = "请提供更多信息"
                                logger.warning(f"prompt_text为None或'None'，已替换为默认值。原始值: {repr(prompt_text)}")
                            logger.info(f"添加到对话历史的content: {repr(prompt_text)}")
                            st.session_state.conversation_history.append({
                                "type": "assistant",
                                "content": prompt_text,
                                "next_action": next_action
                            })

                        st.rerun()

    # 显示对话历史
    if st.session_state.conversation_history:
        st.subheader("对话历史")
        logger.info(f"显示对话历史，共{len(st.session_state.conversation_history)}条消息")

        for i, message in enumerate(st.session_state.conversation_history):
            logger.info(f"处理第{i}条消息: {message}")
            if message["type"] == "user":
                render_conversation_message(message, is_user=True)
            else:
                render_conversation_message(message, is_user=False)

                # 如果是最后一条消息且包含下一步行动
                if i == len(st.session_state.conversation_history) - 1 and "next_action" in message:
                    next_action = message["next_action"]

                    if next_action.get("action") == "ask_slot":
                        st.markdown("---")
                        user_response = render_slot_input_form(next_action, api_url, st.session_state.current_run_id)

                        if user_response:
                            with st.spinner("正在处理您的回答..."):
                                context = {"slot_name": next_action.get("slot_name")}
                                result = process_user_input(api_url, st.session_state.current_run_id, user_response, context)

                                if "error" in result:
                                    st.error(result["error"])
                                else:
                                    # 添加用户回答到历史
                                    st.session_state.conversation_history.append({
                                        "type": "user",
                                        "content": user_response
                                    })

                                    # 处理AI响应
                                    action_data = result.get("data", {})
                                    if action_data.get("action") == "ask_slot":
                                        prompt_text = action_data.get("prompt", "")
                                        if prompt_text is None or prompt_text == "None" or str(prompt_text).strip() == "None":
                                            prompt_text = "请提供更多信息"
                                        st.session_state.conversation_history.append({
                                            "type": "assistant",
                                            "content": prompt_text,
                                            "next_action": action_data
                                        })
                                    elif action_data.get("action") == "plan":
                                        st.session_state.conversation_history.append({
                                            "type": "assistant",
                                            "content": "太好了！我已经收集到足够的信息，现在可以开始为您生成内容了。",
                                            "next_action": action_data
                                        })

                                    st.rerun()

                    elif next_action.get("action") == "plan":
                        st.markdown("---")
                        st.success("🎉 信息收集完成！现在可以生成内容了。")

                        tasks = next_action.get("tasks", [])
                        if tasks:
                            st.subheader("将要生成的内容:")
                            for task in tasks:
                                st.write(f"- {task.get('page_type', '页面')}页面")

                        if st.button("🚀 开始生成内容", key="start_generation"):
                            with st.spinner("正在生成内容..."):
                                # 生成第一个任务的内容
                                if tasks:
                                    task_data = tasks[0]
                                    result = generate_content_ai_native(api_url, st.session_state.current_run_id, task_data)

                                    if "error" in result:
                                        st.error(result["error"])
                                    else:
                                        st.success("内容生成成功！")

                                        # 显示生成的内容
                                        content_data = result.get("data", {})
                                        content = content_data.get("content", {})

                                        if content:
                                            st.subheader("生成的内容:")
                                            render_content_preview(content, "structured")

                                        # 添加到对话历史
                                        st.session_state.conversation_history.append({
                                            "type": "assistant",
                                            "content": f"内容生成完成！已为您创建了{task_data.get('page_type', '页面')}页面。",
                                            "generated_content": content
                                        })

                                        st.rerun()

def render_content_generation_page(api_url: str):
    """渲染内容生成页面"""
    # 主要内容区域
    col1, col2 = st.columns([1, 2])

    with col1:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.header("一句话生成网站")

        # 提示词输入
        prompt = st.text_area(
            label="输入",
            placeholder="例如：创建一个关于人工智能的专题页面，包含技术介绍、应用案例和未来展望",
            height=100,
            label_visibility="collapsed"
        )

        # 生成按钮
        if st.button("生成内容", type="primary"):
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
                                st.warning("检测到缺失必要知识信息")
                                st.session_state['missing_knowledge'] = result.get('missing_knowledge', [])

                                # 显示缺失知识信息
                                st.subheader("需要补充的知识")
                                for missing in result.get('missing_knowledge', []):
                                    with st.expander(missing.get('description', missing.get('topic', '未知'))):
                                        st.write(f"**主题**: {missing.get('topic', '未知')}")
                                        st.write(f"**描述**: {missing.get('description', '无描述')}")
                                        if missing.get('suggested_fields'):
                                            st.write("**建议字段**:")
                                            for field in missing['suggested_fields']:
                                                st.write(f"- {field}")

                                        if st.button(f"添加 {missing.get('topic', '知识')}", key=f"add_{missing.get('topic')}"):
                                            st.session_state.current_page = "knowledge_management"
                                            st.session_state['add_knowledge_topic'] = missing.get('topic')
                                            st.rerun()
                            else:
                                # 正常生成内容
                                st.session_state['last_result'] = result
                                st.success("内容生成成功！")

                                # 显示使用的知识
                                if result.get('knowledge_used'):
                                    st.info(f"使用了知识: {', '.join(result['knowledge_used'])}")
                        else:
                            st.error(f"生成失败：{response.json().get('detail', '未知错误')}")

                    except requests.exceptions.Timeout:
                        st.error("请求超时，请稍后重试")
                    except requests.exceptions.ConnectionError:
                        st.error("无法连接到API服务")
                    except Exception as e:
                        st.error(f"发生错误：{str(e)}")
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.header("生成结果")

        # 显示生成结果
        if 'last_result' in st.session_state:
            result = st.session_state['last_result']

            # 显示元数据
            with st.expander("生成信息"):
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
            st.info("请在左侧输入提示词并点击生成按钮")
        st.markdown('</div>', unsafe_allow_html=True)

def render_knowledge_management_page(api_url: str):
    """渲染知识库管理页面"""
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.header("知识库管理")

    # 创建标签页
    tab1, tab2, tab3 = st.tabs(["知识列表", "添加知识", "统计信息"])

    with tab1:
        st.subheader("现有知识")

        # 获取知识列表
        knowledge_list = get_knowledge_list(api_url)

        if knowledge_list:
            for knowledge in knowledge_list:
                with st.expander(f"{knowledge['topic']} - {knowledge.get('description', '无描述')}"):
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
                        if st.button("删除", key=f"delete_{knowledge['id']}"):
                            if delete_knowledge(api_url, knowledge['id']):
                                st.rerun()
        else:
            st.info("暂无知识条目，请添加一些知识来开始使用。")

    with tab2:
        st.subheader("添加新知识")

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
        if st.button("保存知识", type="primary"):
            if not selected_template:
                st.error("请输入知识主题")
            elif not content:
                st.error("请填写知识内容")
            else:
                if create_knowledge(api_url, selected_template, content, description):
                    st.rerun()

    with tab3:
        st.subheader("知识库统计")

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
                    st.subheader("知识类型分布")
                    st.bar_chart(topic_counts)

                # 显示可用模板
                st.subheader("可用模板")
                for template in stats.get('available_templates', []):
                    st.write(f"- {template}")
            else:
                st.error("获取统计信息失败")
        except Exception as e:
            st.error(f"获取统计信息失败: {str(e)}")
    st.markdown('</div>', unsafe_allow_html=True)

# 主界面
# 侧边栏
with st.sidebar:
    st.header("页面导航")
    page_options = {
        "ai_native_chat": "🤖 AI Native 对话",
        "content_generation": "📝 传统生成",
        "knowledge_management": "📚 知识库管理"
    }

    # 确保session_state已初始化
    current_page = st.session_state.get('current_page', 'ai_native_chat')

    selected_page = st.radio(
        "选择功能页面",
        options=list(page_options.keys()),
        format_func=lambda x: page_options[x],
        index=list(page_options.keys()).index(current_page) if current_page in page_options else 0
    )

    if selected_page != current_page:
        st.session_state.current_page = selected_page
        st.rerun()

    st.markdown("---")
    st.header("系统配置")
    api_url = st.text_input("API服务地址", value=st.session_state.get('api_url', 'http://localhost:8000'))
    if api_url != st.session_state.get('api_url', 'http://localhost:8000'):
        st.session_state.api_url = api_url

    st.markdown("---")
    st.header("系统状态")

    # 检查API状态
    try:
        health_response = requests.get(f"{api_url}/docs", timeout=2)
        if health_response.status_code == 200:
            st.success("✅ API服务正常")
        else:
            st.error("❌ API服务异常")
    except:
        st.error("❌ 无法连接API服务")

# 页面路由
current_page = st.session_state.get('current_page', 'ai_native_chat')
if current_page == "ai_native_chat":
    render_ai_native_chat_page(api_url)
elif current_page == "content_generation":
    render_content_generation_page(api_url)
elif current_page == "knowledge_management":
    render_knowledge_management_page(api_url)

# 页脚
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>GeoCMS v0.3.0 | AI Native 多Agent智能建站系统</p>
        <p>支持状态驱动的多轮对话和知识感知的智能内容生成</p>
    </div>
    """
)