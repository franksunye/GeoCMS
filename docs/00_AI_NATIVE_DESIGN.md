# GeoCMS AI Native 技术设计文档

## 🎯 设计目标

将GeoCMS从传统的"请求-响应"模式升级为AI Native的多Agent协同系统，实现：

1. **状态驱动决策**：由AI Agent根据当前状态决定下一步行动
2. **多轮对话能力**：支持复杂的信息收集和内容生成流程
3. **知识感知增强**：深度集成现有知识库系统
4. **可扩展架构**：为未来更多Agent类型预留扩展空间

## 🏗 核心架构设计

### 状态机设计

```
[开始] → [分析意图] → [检查状态] → [决策分支]
                                        ├── [询问槽位] → [等待用户输入] → [更新状态] ↑
                                        └── [生成内容] → [内容校验] → [完成]
```

### Agent协同流程

```
用户输入 → Planner Agent → 决策 → Action执行
    ↓                         ↓         ↓
状态更新 ← 结果处理 ← Writer/Verifier ← 知识注入
```

## 📊 数据模型设计

### 状态槽位结构
```json
{
  "site_type": "企业官网",
  "brand_name": "GeoCMS科技",
  "target_audience": "中小企业主",
  "content_goals": ["品牌展示", "产品介绍"],
  "pages": [
    {
      "type": "homepage",
      "status": "completed",
      "content_id": 123
    },
    {
      "type": "about",
      "status": "pending"
    }
  ],
  "current_page": "about",
  "knowledge_context": {
    "company_info": {...},
    "product_info": {...}
  }
}
```

### 任务类型定义
- `ask_slot`: 询问用户补充信息
- `generate_content`: 生成内容
- `verify_content`: 校验内容质量
- `update_knowledge`: 更新知识库

## 🤖 Agent设计

### Planner Agent
**职责**：分析当前状态，决定下一步行动

**输入**：
- 用户输入
- 当前状态
- 知识库上下文

**输出**：
```json
{
  "action": "ask_slot",
  "slot_name": "target_audience",
  "prompt": "请描述您的目标用户群体",
  "options": ["企业客户", "个人用户", "开发者"]
}
```

或

```json
{
  "action": "plan",
  "tasks": [
    {
      "type": "generate_content",
      "page_type": "homepage",
      "knowledge_required": ["company_info", "brand_info"]
    }
  ]
}
```

### Writer Agent
**职责**：根据任务和知识上下文生成内容

**增强功能**：
- 知识上下文注入
- 个性化内容生成
- 多种内容格式支持

### Verifier Agent（可选）
**职责**：校验生成内容的质量和一致性

**校验维度**：
- 品牌一致性
- 内容准确性
- 格式规范性
- 知识匹配度

## 🔧 技术实现

### System Prompt管理
```
prompts/
├── planner_agent.json
├── writer_agent.json
├── verifier_agent.json
└── templates/
    ├── ask_slot_templates.json
    ├── content_generation_templates.json
    └── verification_templates.json
```

### API设计

#### `/api/next_action`
**请求**：
```json
{
  "run_id": 123,
  "user_input": "我想创建一个企业官网"
}
```

**响应（询问槽位）**：
```json
{
  "action": "ask_slot",
  "slot_name": "brand_name",
  "prompt": "请告诉我您的公司或品牌名称",
  "current_state": {...},
  "progress": 0.3
}
```

**响应（生成内容）**：
```json
{
  "action": "generate",
  "content": {...},
  "knowledge_used": ["company_info"],
  "next_suggestions": ["添加产品页面", "完善关于我们"]
}
```

### 状态管理服务
```python
class StateManager:
    def update_slot(self, run_id: int, slot_name: str, value: Any)
    def get_missing_slots(self, run_id: int) -> List[str]
    def is_ready_for_generation(self, run_id: int) -> bool
    def get_knowledge_context(self, run_id: int) -> Dict[str, Any]
```

### Agent协调器
```python
class AgentCoordinator:
    def process_user_input(self, run_id: int, user_input: str) -> Dict[str, Any]
    def execute_planner_decision(self, decision: Dict[str, Any]) -> Dict[str, Any]
    def coordinate_agents(self, task: Dict[str, Any]) -> Dict[str, Any]
```

## 🔄 工作流程

### 1. 新会话创建
```python
# 用户："我想创建一个企业官网"
run = create_planner_run(user_intent="创建企业官网")
state = initialize_state()
decision = planner_agent.analyze(user_intent, state)
# → ask_slot: brand_name
```

### 2. 槽位填充
```python
# 用户："GeoCMS科技"
update_state(run_id, "brand_name", "GeoCMS科技")
decision = planner_agent.analyze(user_intent, updated_state)
# → ask_slot: target_audience
```

### 3. 内容生成
```python
# 所有必要槽位填充完成
decision = planner_agent.analyze(user_intent, complete_state)
# → plan: [generate_homepage, generate_about]
content = writer_agent.generate(task, knowledge_context)
verification = verifier_agent.verify(content)  # 可选
```

## 🎯 配置驱动架构

### 核心原理
AI Native架构的核心特性是**配置驱动**：
- **配置即代码**：业务逻辑通过JSON配置定义
- **提示即逻辑**：对话流程通过提示词模板控制
- **热重载支持**：配置修改无需重启服务

### 配置文件结构
```json
{
  "system_prompt": "Agent的系统提示词",
  "slot_definitions": {
    "slot_name": {
      "description": "槽位描述",
      "prompt": "询问提示词",
      "options": ["选项1", "选项2"],
      "required": true,
      "priority": 1
    }
  },
  "task_generation_rules": {
    "网站类型": [
      {
        "type": "generate_content",
        "page_type": "homepage",
        "knowledge_required": ["company_info"]
      }
    ]
  },
  "knowledge_requirements": {
    "knowledge_type": {
      "description": "知识描述",
      "required_for": ["适用场景"]
    }
  }
}
```

### 配置驱动的优势

#### 🚀 业务敏捷性
- **产品经理可以直接修改JSON调整对话流程**
- **无需开发人员参与**：业务逻辑变更不需要代码修改
- **快速A/B测试不同的槽位组合**：实时验证用户体验
- **快速响应市场需求**：配置修改即时生效

#### 📈 可扩展性
- **新增槽位只需在JSON中添加**：零代码扩展功能
- **支持复杂的条件逻辑**：基于状态的动态行为
- **多语言支持只需翻译JSON**：国际化成本极低
- **模块化配置设计**：不同业务场景独立配置

#### 🔧 维护性
- **业务逻辑与代码分离**：降低系统复杂度
- **配置版本化管理**：Git管理配置变更历史
- **回滚简单快速**：配置错误可秒级恢复
- **团队协作友好**：产品、开发、运营各司其职

### 演示示例
```bash
# 运行配置驱动演示
python docs/examples/config_driven_demo.py

# 测试对话流程
python tests/e2e/test_conversation_flow.py

# 热重载配置
curl -X POST "http://localhost:8000/api/ai-native/reload-config"
```

## 💡 AI Native架构哲学

### 核心理念
**"配置即代码，提示即逻辑"** - 这是AI Native架构的核心哲学：

1. **配置即代码**：
   - 业务逻辑通过配置文件定义
   - 配置文件享有与代码同等的版本控制
   - 配置变更等同于功能迭代

2. **提示即逻辑**：
   - 对话流程通过提示词模板控制
   - 提示词的质量直接决定用户体验
   - 提示工程成为核心竞争力

3. **状态驱动**：
   - AI主导对话流程
   - 用户只需响应AI的引导
   - 系统智能管理对话状态

### 设计原则
1. **解耦优先**：配置与代码彻底分离
2. **热更新**：配置修改无需重启服务
3. **可观测**：完整的状态追踪和日志
4. **可测试**：每个配置变更都可测试验证
5. **向后兼容**：新功能不破坏现有API

## 🔮 进一步的改进方向

### 更智能的配置
- **条件槽位**：基于前面的回答决定是否询问
  ```json
  {
    "slot_name": "company_size",
    "condition": {
      "if": "site_type == '企业官网'",
      "then": "required",
      "else": "optional"
    }
  }
  ```
- **动态选项**：选项根据上下文变化
  ```json
  {
    "options_source": "dynamic",
    "options_rule": "get_industry_options(brand_name)"
  }
  ```
- **多分支对话流程**：支持复杂的对话树结构

### 可视化配置
- **对话流程图编辑器**：拖拽式设计对话流程
- **拖拽式槽位设计**：可视化配置槽位属性
- **实时预览功能**：配置修改即时预览效果
- **配置模板库**：预设常用对话模板

### AI辅助配置
- **AI自动生成提示词**：基于槽位描述生成最佳提示
- **智能推荐槽位组合**：分析用户行为推荐最优配置
- **自动优化对话效果**：基于对话数据持续优化
- **配置质量评估**：AI评估配置的用户体验

### 高级特性
- **个性化对话**：基于用户画像调整对话风格
- **情感感知**：识别用户情绪调整对话策略
- **多模态交互**：支持语音、图像等多种输入
- **对话记忆**：跨会话的上下文记忆

## 📈 扩展性设计

### 新Agent类型
- **SEO Agent**：搜索引擎优化建议
- **Design Agent**：视觉设计建议
- **Analytics Agent**：数据分析和优化建议
- **Personalization Agent**：个性化推荐引擎
- **Quality Agent**：内容质量评估和改进

### 新槽位类型
- **技术需求**：响应式设计、多语言支持
- **业务目标**：转化率、用户留存
- **内容策略**：更新频率、内容类型

### 新任务类型
- **optimize_content**：内容优化
- **generate_variations**：生成内容变体
- **analyze_performance**：性能分析

## 🎯 成功指标

### 用户体验
- 平均对话轮数 < 5轮
- 用户满意度 > 90%
- 任务完成率 > 95%

### 技术指标
- API响应时间 < 2秒
- 系统可用性 > 99.9%
- 并发支持 > 100用户

### 内容质量
- 知识匹配准确率 > 95%
- 内容一致性评分 > 4.5/5
- 用户采纳率 > 80%

## 🚀 实施路径

### 渐进式升级
1. **保持向后兼容**：现有API继续工作
2. **并行开发**：新旧系统同时运行
3. **灰度发布**：逐步切换用户流量
4. **监控反馈**：实时监控系统表现

### 风险控制
1. **回滚机制**：每个阶段都有快速回滚方案
2. **性能监控**：实时监控系统性能指标
3. **用户反馈**：建立快速反馈收集机制
4. **测试覆盖**：确保>95%的测试覆盖率
