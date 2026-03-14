# 项目说明

这是一个用 TypeScript 编写的「Agent/工具调用」最小实现原型：入口从命令行读取用户输入，加载本地配置（模型 URL / API Key / 模型名 / Agent 工作目录等），初始化全局 `ProjectContext`，然后运行 `AgentCore` 进入多步推理与工具调用循环。

> 备注：代码里仍保留部分 “HarmonyOS” 相关文案/注释（主要在 prompt 文本中），当前工程已按 Node.js CLI 方式可构建运行。

---

## 1) 给开发者的：运行方式与核心结构

### 环境要求

- Node.js：建议 **18+**（需要内置 `fetch`）
- npm：随 Node 安装

### 快速开始

1. 安装依赖

```bash
npm i
```

2. 准备配置文件

```bash
cp config.example.json config.json
```

编辑 `config.json`，填入：

- `model.apiUrl`：Chat Completions 兼容接口地址
- `model.apiKey`：密钥（不要提交到 git）
- `model.modelName`：模型名
- `agent.workDir`：Agent 运行/落盘目录（相对 config 文件所在目录解析）
- `agent.skillsDir`：技能目录（相对 config 文件所在目录解析）

3. 开发运行

```bash
npm run dev -- --config config.json "你的问题"
```

4. 构建与运行

```bash
npm run build
npm run start -- --config config.json "你的问题"
```

> 入口参数：`--config <path>`；也支持环境变量 `PROJECT_CONFIG` 指定配置路径。

### 配置文件结构（`config.json`）

示例见 `config.example.json`，核心字段：

- `model.apiUrl` / `model.apiKey` / `model.modelName`
- `agent.workDir`：Agent 工作目录（会自动创建）
- `agent.skillsDir`：技能目录（用于加载 `<skillFolder>/SKILL.md`）
- `agent.allowedDir`：工具允许操作的目录（可选；用于限制文件读写范围）
- `agent.maxSteps`：最大步数（默认 20）
- `agent.restrictToWorkspace`：是否限制在工作空间内（默认 `true`）

### 代码结构

- `main.ts`：CLI 入口；加载配置 → `ProjectContext.init` → `AgentCore.run`
- `src/env/ProjectContext.ts`：全局上下文（配置 + 路径解析后的绝对路径）
- `src/config/loadConfig.ts`：配置读取与字段校验（JSON）
- `src/agent/AgentCore.ts`：Agent 主循环（history / tool calls / finish）
- `src/agent/LlmClient.ts`：HTTP 调用（Node `fetch`），解析 tool_calls
- `src/agent/ToolsManager.ts`：工具注册与执行
- `src/agent/tools/*`：内置工具（read/write/edit/list/finish）
- `src/agent/SkillLoader.ts`：从 `skillsDir` 加载技能元信息与文档
- `src/utils/*`：日志与文件工具
- `dist/`：`tsc` 输出目录（构建产物）

> 仓库根目录目前还存在空目录 `agent/`、`utils/`（历史遗留、已迁移到 `src/`），不再使用，可按需删除。

---

## 2) 给“我自己”的：进度记录与验证要求（新 Session 快速接手）

### 当前进度（截至 2026-03-14）

- 已完成：将核心代码迁移到 `src/`，并新增配置体系
  - `ProjectContext`（`src/env/ProjectContext.ts`）统一保存 `config` 与解析后的 `paths`
  - `loadProjectConfig`（`src/config/loadConfig.ts`）负责读取 `config.json` 并做最小字段校验
- 已完成：入口 `main.ts` 支持 `--config` / `PROJECT_CONFIG`，并会创建 `agent.workDir`
- 已完成：`npm run build` 可通过（`tsc -p tsconfig.json`）
- 已完成：`LLMClient` 已改为 Node `fetch` 实现（不再依赖 HarmonyOS HTTP Kit）
- 已注意：`config.json` 已加入 `.gitignore`，避免泄露密钥

### 编码约束（保持一致性）

- 代码只放在 `src/`（入口保留 `main.ts`）
- 当前编译产物为 **CommonJS**（`tsconfig.json`：`module: "commonjs"`）；不要混用 ESM
- 配置解析规则：
  - `agent.workDir/skillsDir/allowedDir` 均以 **config 文件所在目录** 为基准解析为绝对路径
  - 需要新增配置字段时：先更新 `src/env/ProjectContext.ts` 类型，再更新 `src/config/loadConfig.ts` 校验与默认值

### 验证要求（每次改动后至少完成）

1. 类型检查/构建必须通过

```bash
npm run build
```

2. 如果改动涉及入口/配置加载：至少跑一次无输入启动（确认能打印 Usage）

```bash
npm run dev -- --config config.json
```

3. 如果改动涉及 Agent 主流程：使用真实可用的 `model.apiKey` 做一次端到端跑通（可选但推荐）

```bash
npm run start -- --config config.json "hello"
```

### 已知待改进点（可做为后续 TODO）

- `AgentCore` 的 system prompt 文案仍偏 HarmonyOS 语境（不影响运行，但会影响模型行为）
- 仓库根目录遗留空目录 `agent/`、`utils/`（已迁移到 `src/`）
- 尚无测试用例；如后续引入测试，优先从配置加载与路径限制（`allowedDir`）开始补
