# 潮玩造梦师（ChaoPlay Dreamer）

面向潮玩设计师、艺术创作者与收藏爱好者的 Web 端 AI 潮玩设计生成工具原型。项目遵循 `request.md` 中的产品需求，提供 Prompt 输入、风格/材质预设管理、生成结果展示与历史记录等核心体验，界面采用深色赛博风格与响应式布局，方便后续接入 SeedDream 4.0 等实际模型服务。

> 📷 建议在完成真实 API 接入与首轮调试后补充高分辨率页面截图（可以在 `docs/` 目录添加图片，并在本文档插入）。当前示例图片使用占位符，以便快速搭建界面。

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5（默认监听 `5173` 端口，支持 HMR）
- **样式方案**：原子化 CSS 变量 + 手写组件样式（CSS Modules 风格隔离，面向深色 UI）
- **状态管理**：React 内部状态（`useState` / `useMemo`）

## 环境要求

| 工具 | 版本建议 |
| --- | --- |
| Node.js | ≥ 18.0.0（建议使用 LTS 版本） |
| npm / pnpm / yarn | 任选其一，示例使用 `npm` |

## 快速开始

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动开发服务器（默认监听 `http://localhost:5173`，对局域网开放）

   ```bash
   npm run dev
   ```

3. 构建生产包

   ```bash
   npm run build
   ```

4. 预览生产构建结果（先执行 `npm run build`）

   ```bash
   npm run preview
   ```

5. 类型检查（无输出即通过）

   ```bash
   npm run lint
   ```

> 若希望使用 `pnpm` 或 `yarn`，仅需将上述命令替换为对应的包管理器语法。首次安装依赖需保证可以访问 npm 官方源或配置镜像。

## 目录结构

```
new_web/
├── index.html               # Vite 入口 HTML
├── package.json             # 项目依赖与脚本定义
├── tsconfig*.json           # TypeScript 编译配置
├── vite.config.ts           # Vite 配置（含 host/port）
├── public/
│   └── favicon.svg          # Favicon 占位符
├── src/
│   ├── App.tsx              # 页面入口，组装核心模块
│   ├── main.tsx             # React 渲染入口
│   ├── types.ts             # 统一定义生成任务/预设类型
│   ├── constants/
│   │   └── presets.ts       # 系统风格与材质预设示例
│   ├── components/
│   │   ├── AppHeader.*      # 顶部导航与 CTA
│   │   ├── PromptComposer.* # Prompt 输入与预设标签
│   │   ├── PresetSection.*  # 风格/材质预设列表
│   │   ├── PresetCard.*     # 单个预设卡片（收藏/编辑/删除）
│   │   ├── PresetEditorForm.tsx # 预设增改弹窗表单
│   │   ├── Modal.*          # 通用模态框容器
│   │   ├── GenerationGallery.* # 生成结果展示区
│   │   └── HistoryPanel.*   # 生成历史记录侧边栏
│   └── styles/
│       ├── index.css        # 全局主题、字体、滚动条
│       └── app.css          # 布局骨架与提示 Toast
├── README.md                # 项目使用说明（本文档）
└── request.md               # 产品需求原文（仅供参考）
```

## 功能说明

- **创意输入（Prompt Composer）**：支持 500 字内多行输入，统计字数，结合选中预设生成最终 Prompt。提供清空预设按钮与使用说明。
- **预设管理（Preset Section）**：风格 / 材质分区，包含系统预设和“我的预设”两个标签页；支持收藏官方预设、模态框内手动新增/编辑/删除自定义预设，并即时反映在 Prompt 组合中。
- **生成流程（Generation Gallery）**：生成时展示状态提示，完成后展示多张图片卡片（当前使用占位符图片），每张卡片附带 Seed 与尺寸信息、下载与复制链接按钮。
- **历史记录（History Panel）**：按时间倒序展示生成任务，可点击快速回溯查看旧结果，同时触发提示 Toast。
- **导航与反馈**：顶部导航锚点便于快速定位不同模块；统一 Toast 反馈收藏、删除、复制、切换等操作；响应式布局在 ≥768px 屏幕上表现最佳。

## SeedDream 4.0 API 接入指引

当前项目使用 `setTimeout` 和占位图模拟 AI 生成流程。接入真实模型服务时，可参考以下步骤：

1. 新增环境变量（在项目根目录创建 `.env.local`）：

   ```bash
   VITE_SEEDDREAM_API_URL=https://api.example.com/v1/generate
   VITE_SEEDDREAM_API_KEY=your_api_key_here
   ```

2. 将 `src/App.tsx` 中 `handleGenerate` 的 `setTimeout` 替换为真实 `fetch` 请求，示例：

   ```ts
   const response = await fetch(import.meta.env.VITE_SEEDDREAM_API_URL, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       Authorization: `Bearer ${import.meta.env.VITE_SEEDDREAM_API_KEY}`
     },
     body: JSON.stringify({
       prompt: mergedPrompt,
       size: "512x640",
       seed: crypto.randomUUID()
     })
   });
   const payload = await response.json();
   // 将 payload 解析为 GeneratedArtwork[]，更新任务状态
   ```

3. 若接口返回二进制图片，可将其转换为 `Blob` 并使用 `URL.createObjectURL` 生成可下载链接，或存储为自建对象存储地址。

4. 根据业务需要补充错误处理、重试机制与生成进度轮询等。

## 自定义与扩展

- **组件定制**：`src/components` 目录内所有模块均为函数式组件，可按需拆分或替换样式文件，已有 className 便于接入 Tailwind、CSS-in-JS 等方案。
- **预设数据源**：系统预设暂存于 `src/constants/presets.ts`，生产环境建议改为接口拉取或 CMS 管理，并为缩略图替换真实示意图。
- **国际化**：界面文案统一存放在组件内部，可结合 `i18next` 等库引出配置，方便拓展英文或其他语言版本。
- **状态持久化**：可后续接入 `localStorage` / IndexedDB 记录“我的预设”与历史任务，或使用状态管理库（Redux/Zustand）提升可维护性。

## 已知限制

- 生成结果使用在线占位图 `dummyimage.com`，需要真实模型或素材时请替换为正式资源；如需离线环境，可将图片改为本地静态资源。
- 未包含实际用户体系、鉴权与限流策略，部署前需补齐登录、额度与错误提示等逻辑。
- 未默认集成自动化测试，可依据业务复杂度补充组件单测或端到端测试。

## 后续建议

1. 接入后端推理服务（SeedDream 4.0）并完善错误提示、重试与队列管理。
2. 增加生成参数（尺寸、批次数、随机种子）配置面板，支持更多自定义选项。
3. 建立素材资产库与图像优化策略，提升加载与下载体验。
4. 编写组件级测试与 UI 回归流程，确保迭代稳定性。

祝项目顺利，欢迎继续拓展体验或提出新的需求 🙌
