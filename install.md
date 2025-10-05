# 开发环境安装与启动指南

本文档提供完整的项目本地环境搭建步骤，涵盖 Node.js / npm / pnpm、Vite 开发服务器以及 SeedDream 接口所需的环境变量设置。按照下述顺序执行，即可快速完成初次安装与验证。

## 1. 基础依赖准备

### 1.1 Node.js
- 建议安装 **Node.js 18 LTS（18.x）** 或更新版本。
- 推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node 版本：
  ```bash
  # 安装 nvm（macOS/Linux）
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  # 加载 nvm（根据终端类型执行 profile 文件）
  source ~/.bashrc  # 或 ~/.zshrc
  # 安装并启用 Node 18 LTS
  nvm install 18
  nvm use 18
  ```
- Windows 用户可使用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 或直接安装官方 MSI 包。

### 1.2 npm / pnpm（可选）
- Node 自带 **npm**，可升级到最新版：
  ```bash
  npm install -g npm
  ```
- 若偏好使用 **pnpm**，可额外安装：
  ```bash
  npm install -g pnpm
  ```
  本项目默认脚本基于 npm，若改用 pnpm，请将 README / install 命令替换为对应语法。

## 2. 项目依赖安装
1. 进入项目根目录：
   ```bash
   cd /Users/liuyixian/projects/new_web
   ```
2. 安装前端依赖：
   ```bash
   npm install
   ```
   - 如在中国大陆网络环境，可考虑使用 `npm config set registry https://registry.npmmirror.com` 提升安装速度。

## 3. 环境变量配置
1. 复制示例文件或直接编辑 `.env.local`（项目根目录）：
   ```env
   # Ark SeedDream 接口地址
   VITE_SEEDDREAM_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
   # Ark 控制台中获取的 API Key
   VITE_SEEDDREAM_API_KEY=17e900d2-979f-4cd1-8031-5c19ed387035
   # 使用的模型标识，可根据实际情况调整
   VITE_SEEDDREAM_MODEL=doubao-seedream-4-0-250828
   # 开发阶段代理路径，需与 vite.config.ts 中保持一致
   VITE_SEEDDREAM_PROXY_PATH=/seed-dream
   ```
2. **安全提示**：API Key 属于敏感信息，确保 `.env.local` 列入 `.gitignore`（项目已默认忽略）。生产环境建议通过 CI/CD 下发或部署平台提供的 Secret 管理。

## 4. 启动与验证

### 4.1 开发服务器（Vite）
1. 确认 `.env.local` 已配置完毕。
2. 启动 Vite 开发服务器（支持热更新）：
   ```bash
   npm run dev
   ```
3. 默认访问地址为 `http://localhost:5173`。
4. 浏览器打开后，在控制台（Console）可以看到以 `[SeedDream]` 开头的日志：
   - 若请求走本地代理，会看到请求发往 `/seed-dream`，并且状态码来自真实 Ark 接口。
   - 如果日志提示 “未配置 SeedDream 接口” 或 “生成失败：...”，请检查 `.env.local` 与网络连通性。

### 4.2 类型检查 / 构建
- 运行 TypeScript 检查：
  ```bash
  npm run lint
  ```
- 生产构建：
  ```bash
  npm run build
  ```
- 构建预览：
  ```bash
  npm run preview
  ```

## 5. SeedDream 接口调试（可选）
若需在命令行直接验证 Ark SeedDream 接口，可使用 `scripts_test` 目录提供的示例脚本：

- Shell 版（`curl`）：
  ```bash
  bash scripts_test/seed_dream_test.sh
  ```
- Python 版（需先安装 `volcenginesdkarkruntime`）：
  ```bash
  pip install volcenginesdkarkruntime
  python scripts_test/seed_dream_test.py
  ```

确保网络允许访问 `https://ark.cn-beijing.volces.com`，否则浏览器会因 CORS 或网络策略被拦截。

## 6. 常见问题
- **端口占用**：若 `5173` 已被占用，可在 `package.json` 或执行命令时覆写 `--port`。
- **SSL 或证书问题**：代理默认使用 HTTPS，可在 `vite.config.ts` 的 proxy 配置上调整 `secure` 选项。
- **CORS 报错**：请确认通过本地代理发起请求（即访问 `/seed-dream` 路径），并重启 `npm run dev` 以应用新的代理配置。

按照以上步骤操作，即可在本地完整搭建潮玩造梦师的开发环境。若遇到未覆盖的问题，请记录控制台输出与错误信息，便于进一步排查。
