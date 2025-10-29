# Midas Shiny 2.0

全新版本的 Midas Shiny 围绕“提示词输入 → Agent 协作 → 最终渲染”设计了三段式体验流程。前端使用 React + TypeScript，实现了多页面路由、Agent 会话管理以及与后台 Python 服务的接口对接；后端负责大模型推理、知识检索与图片生成，使用户可以一步步完善需求并获得高清潮玩渲染图。

> 本仓库仅包含前端实现与知识库示例，Agent 推理与生图模型需通过独立的 Python 服务提供。

## 技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **样式**：定制化深色主题 CSS
- **状态管理**：React Hooks（`useState` / `useEffect` / `useMemo`）

## 快速开始

```bash
# 1. 安装依赖（需要 Node.js ≥ 18）
npm install

# 2. 启动开发服务器
npm run dev

# 3. 构建生产包
npm run build

# 4. 预览生产构建
npm run preview

# 5. 类型检查
npm run lint
```

> 也可以将上述命令替换为 `pnpm` 或 `yarn`。首次安装请确保能够访问 npm 镜像。

## 环境变量配置

在终端中执行以下命令，将 API Key 注入当前会话的环境变量：

```bash
export ARK_API_KEY='17e900d2-979f-4cd1-8031-5c19ed387035'
```

## 目录结构

```
new_web/
├── knowledge/                 # 潮玩知识库示例，供 Python Agent 检索
│   ├── README.md
│   └── toy-knowledge.json
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── agent.ts           # 前端调用 Python Agent 服务的接口封装
│   ├── pages/
│   │   ├── PromptIntakePage.tsx
│   │   ├── AgentCollaborationPage.tsx
│   │   └── FinalGenerationPage.tsx
│   ├── styles/
│   │   └── agent-flow.css     # 三页式体验的风格样式
│   ├── App.tsx                # 内置轻量路由与页面装配
│   ├── main.tsx               # React 入口
│   ├── types.ts               # 通用数据类型定义
│   └── i18n.tsx               # 语言环境（保留自旧版）
├── package.json
├── tsconfig*.json
├── vite.config.ts
└── TODO.txt
```

旧版生成器仍保留在 `src/App2.tsx` 及相关组件中，可按需参考或复用。

## 核心页面与流程

1. **创意录入页（PromptIntakePage）**  
   - 用户描述心仪的潮玩设定，可补充备注并上传灵感图。  
   - 提交后调用 `POST /api/agent/sessions` 创建会话，返回会话 ID。

2. **Agent 协作页（AgentCollaborationPage）**  
   - 左侧为用户与 AI Agent 的对话区，支持持续补充需求。  
   - 右侧展示 Agent 的设计计划、引用的知识条目及生成的草图。  
   - 调用 `GET /api/agent/sessions/:id`、`GET /messages` 读取历史，`POST /messages` 发送新消息。

3. **最终生成页（FinalGenerationPage）**  
   - 汇总已确认的需求，展示最终 prompt。  
   - 通过 `POST /api/agent/sessions/:id/finalize` 触发 Python 后端整合 prompt 并调用生图模型。  
   - 返回高清渲染图，可下载或复制 prompt 到其他工具使用。

整个流程遵循“前端收集、后端推理、前端展示”的职责划分，确保所有模型与知识检索逻辑由后台统一维护。

## 前端与 Python Agent 服务接口约定

所有接口统一以 `VITE_AGENT_API_BASE` 为前缀（默认 `/api/agent`），请求与响应均为 JSON，上传图片使用 `multipart/form-data`。

> 本地开发若尚未启动 Python Agent，可保持 `VITE_AGENT_USE_MOCK` 默认为开启状态（开发环境自动启用），前端会使用内置的模拟对话与占位图，避免 404 错误。部署连接真实后端时，可在 `.env` 中声明 `VITE_AGENT_USE_MOCK=false`。

| Endpoint | 方法 | 请求参数 | 返回示例 |
| --- | --- | --- | --- |
| `/sessions` | `POST` | `prompt`、`notes?`、`locale?`、`referenceImage?` | `AgentSessionSummary` |
| `/sessions/{id}` | `GET` | – | `AgentSessionDetail` |
| `/sessions/{id}/messages` | `GET` | – | `AgentMessage[]` |
| `/sessions/{id}/messages` | `POST` | `message`、`attachments?[]` | `{ message, plan?, artworks? }` |
| `/sessions/{id}/finalize` | `POST` | – | `{ finalPrompt, generatedArtworks, session }` |
| `/knowledge` | `GET` | – | `KnowledgeEntry[]`（可由后端直接读取 `knowledge/` 目录） |

### 数据结构（节选）

- `AgentSessionSummary`：`{ id, initialPrompt, status, createdAt, referenceImageUrl?, notes? }`
- `AgentPlanStep`：`{ id, title, detail?, status }`
- `AgentMessage`：`{ id, role, content, createdAt, attachments? }`
- `GeneratedArtwork`：`{ id, imageUrl, seed?, sizeLabel? }`
- `FinalizeSessionResponse`：`{ finalPrompt, generatedArtworks, session }`

接口出错时建议返回 `{ message: string }`，前端会显示在页面中。

## 知识库维护指引

`knowledge/` 目录示例了推荐的数据形态：以结构化 JSON 列出主题、摘要、标签与可直接复用的 prompt 片段。后端可根据会话内容检索最相关的条目，并在对话与最终 prompt 中引用。

为了便于扩展，可遵循以下约定：

- 新增主题时更新 `toy-knowledge.json` 或拆分为按类别划分的文件；
- 保持 `id` 唯一，用于前后端同步引用；
- 如需图文等富媒体，可在此目录放置原始素材，并在后端转换为可访问的 URL。

## 已知限制与后续工作

- 当前仓库未包含 Python Agent 与生图模型，需要按接口约定自行实现。  
- 三个页面的路由通过 `history.pushState` 自行管理，不依赖 `react-router`；如需更复杂的导航可替换为成熟路由方案。  
- 未接入用户体系、存储与权限控制，部署前需补齐鉴权、限流等能力。  
- 建议在后端补充对话记录持久化、知识检索策略（如向量检索）、生成状态轮询等功能。

如在接入后端接口时遇到问题，可优先检视网络面板中的请求与返回内容，或根据上述接口约定进行排查。欢迎继续拓展更多玩法与生产流程的定制能力。
