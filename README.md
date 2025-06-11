# GeoCMS PoC

基于 LLM 的内容生成系统概念验证项目。

## 技术栈

- 后端：Python + FastAPI
- 数据库：SQLite
- AI 框架：LangChain
- 前端：Streamlit

## 快速开始

1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

2. 配置环境变量：
   创建 `.env` 文件并添加：
   ```
   OPENAI_API_KEY=your_api_key
   ```

3. 启动后端服务：
   ```bash
   uvicorn app.main:app --reload
   ```

4. 启动前端界面：
   ```bash
   streamlit run frontend/streamlit_app.py
   ```

5. 访问应用：
   - 前端界面：http://localhost:8501
   - API 文档：http://localhost:8000/docs

## 项目结构

```
/
├── app/
│   ├── api/
│   │   └── run_prompt.py           # FastAPI 接口
│   ├── agents/
│   │   ├── planner.py             # Prompt 拆解
│   │   └── writer.py              # 内容生成
│   ├── db.py                      # SQLite 连接
│   ├── models.py                  # 数据模型
│   └── main.py                    # 应用入口
├── frontend/
│   └── streamlit_app.py          # Streamlit 界面
├── requirements.txt
└── README.md
```

## 开发计划

- [ ] 完善 Prompt 处理流程
- [ ] 添加内容引用检测
- [ ] 迁移到 PostgreSQL
- [ ] 升级前端到 React/Next.js 