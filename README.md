# 项目说明

这是一个用 TypeScript 编写的「模拟鸿蒙Agent/工具调用」最小实现原型：入口从命令行读取用户输入，加载本地配置（模型 URL / API Key / 模型名 / Agent 工作目录等），初始化全局 `ProjectContext`，然后运行 `AgentCore` 进入多步推理与工具调用循环。

项目目标：用 TS 项目模拟鸿蒙环境中的 Agent，作为 **Agent 能力评测框架**。未来通过修改模型配置文件更换模型，在同一套测试用例下运行，评估不同模型在不同维度的能力表现。

> 备注：代码里仍保留部分 “HarmonyOS” 相关文案/注释（主要在 prompt 文本中），当前工程已按 Node.js CLI 方式可构建运行。

---

## 0) 评测框架说明（当前实现）

目前评测框架包含 **自动化评分** 能力，已从 PinchBench 的任务描述迁移并用 TypeScript 重写，放在 `evaluation/` 下：

- `evaluation/tasks/`：任务定义（从 PinchBench `skill/tasks` 复制后逐步整理）
- `evaluation/cli.ts`：评测入口（读取任务输出 + 自动化评分）
- `evaluation/graders/automated.ts`：各任务的自动化评分实现

`evaluation/tasks/` 结构，把 prompt/元信息、自动化检查、资源文件拆开，便于阅读与复用：

```
evaluation/tasks/task_08_memory/
  task_08_memory.md           # prompt / grading criteria / metadata
  automated_check.ts          # automated grader entry (optional)
  workspace/                  # resource files for the task (optional)
    notes.md
```

> 说明：新结构任务在 frontmatter 中可声明 `workspace_dir`（如 `workspace`）和 `automated_check`（如 `automated_check.ts`）。评测时如果存在 `automated_check`，会优先加载该文件进行评分。

已支持的任务类型：
- `automated`：可直接评分（如 `task_00_sanity`、`task_01_calendar`、`task_08_memory`、`task_09_files`、`task_12_skill_search`）
- `hybrid`：仅计算自动化部分（如 `task_16_email_triage`、`task_17_email_search`）
- `llm_judge`：尚未实现 LLM 裁判（目前会标记为不支持）

当前不包含 **自动执行任务** 的 runner，评测依赖你已有的 `evaluation_results/<model>/<task_id>/` 输出。

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

### 评测使用（自动化评分）

评测输入目录结构示例（你已有的手动测试产物）：

```
evaluation_results/
  qwen3.5-35b-a3b/
    task_00_sanity/
      task_00_sanity_messages.json
    task_01_calendar/
      messages.json
      mockapps/Calendar/events.json
```

运行评测：

```bash
npm run evaluate -- --results evaluation_results/qwen3.5-35b-a3b
```

可选参数：
- `--tasks task_00_sanity,task_01_calendar`
- `--output evaluation_results/qwen3.5-35b-a3b/report.json`
- `--tasks-dir evaluation/tasks`

### 配置文件结构（`config.json`）

示例见 `config.example.json`，核心字段：

- `model.apiUrl` / `model.apiKey` / `model.modelName`
- `agent.workDir`：Agent 工作目录（会自动创建）
- `agent.skillsDir`：技能目录（用于加载 `<skillFolder>/SKILL.md`）
- `agent.allowedDir`：工具允许操作的目录（可选；用于限制文件读写范围）。支持字符串或字符串数组（多个允许目录）
- `agent.resetHistoryOnFinish`：是否在每次任务完成后清空历史（默认 `true`，日志始终按时间戳保存）
- `agent.maxSteps`：最大步数（默认 20）
- `agent.restrictToWorkspace`：是否限制在工作空间内（默认 `true`）

### 工具配置（`tools.json`）

`tools.json` 用于声明 **所有工具**，每个工具都必须显式列出，用 `enabled` 控制启停。工具通过 **静态注册表** 方式创建（不使用动态 import），避免运行时因为路径/产物差异导致工具加载失败。

示例：

```json
{
  "tools": [
    {
      "name": "read_file",
      "enabled": true
    },
    {
      "name": "finish",
      "enabled": true
    }
  ]
}
```

字段说明：
- `name`：工具名（必须与工具类实例的 `tool.name` 一致）
- `enabled`：是否启用该工具

兼容字段（历史遗留，可选）：
- `module` / `export`：旧版动态加载使用的字段；当前版本会忽略它们（保留仅用于兼容旧配置文件）。

注意：
- `tools.json` 不存在会报错（与 `config.json` 一样是必需配置）
- 禁用 `finish` 可能导致 Agent 无法正常结束
- 工具是否可用取决于代码内的静态工具注册表（见 `src/agent/toolRegistry.ts`）

### 代码结构

- `main.ts`：CLI 入口；加载配置 → `ProjectContext.init` → `AgentCore.run`
- `src/env/ProjectContext.ts`：全局上下文（配置 + 路径解析后的绝对路径）
- `src/config/loadConfig.ts`：配置读取与字段校验（JSON）
- `src/config/loadToolsConfig.ts`：工具配置读取与字段校验（JSON）
- `src/agent/AgentCore.ts`：Agent 主循环（history / tool calls / finish）
- `src/agent/AgentQueue.ts`：消息队列（串行化用户与心跳任务）
- `src/agent/LlmClient.ts`：HTTP 调用（Node `fetch`），解析 tool_calls
- `src/agent/ToolsManager.ts`：工具注册与执行
- `src/agent/HeartbeatScheduler.ts`：心跳调度与 HEARTBEAT.md 解析
- `src/agent/tools/*`：内置工具（read/write/edit/list/finish）
- `src/mockapps/*`：模拟的系统/三方应用（供 tools 调用）
- `src/agent/SkillLoader.ts`：从 `skillsDir` 加载技能元信息与文档
- `src/utils/*`：日志与文件工具
- `dist/`：`tsc` 输出目录（构建产物）

> 仓库根目录目前还存在空目录 `agent/`、`utils/`（历史遗留、已迁移到 `src/`），不再使用，可按需删除。

---

## 2) 给“我自己”的：进度记录与验证要求（新 Session 快速接手）

### 当前进度（截至 2026-03-17）

- 已完成：将核心代码迁移到 `src/`，并新增配置体系
  - `ProjectContext`（`src/env/ProjectContext.ts`）统一保存 `config` 与解析后的 `paths`
  - `loadProjectConfig`（`src/config/loadConfig.ts`）负责读取 `config.json` 并做最小字段校验
- 已完成：入口 `main.ts` 支持 `--config` / `PROJECT_CONFIG`，并会创建 `agent.workDir`
- 已完成：`npm run build` 可通过（`tsc -p tsconfig.json`）
- 已完成：`LLMClient` 已改为 Node `fetch` 实现（不再依赖 HarmonyOS HTTP Kit）
- 已注意：`config.json` 已加入 `.gitignore`，避免泄露密钥
- 已完成：`tools.json` 驱动工具启停（静态注册表），不再在运行时动态加载模块
- 已完成：模拟应用 `mockapps/memo`（备忘录）与对应工具
- 已完成：心跳逻辑独立化 + 消息队列机制（用户输入与心跳任务串行化）
- 已完成：新增 `evaluation/` 评测目录，支持对历史结果进行自动化评分
  - 自动化评分任务：`task_00_sanity`、`task_01_calendar`、`task_08_memory`、`task_09_files`、`task_12_skill_search`
  - 混合任务：`task_16_email_triage`、`task_17_email_search`（仅自动化部分）
  - `llm_judge` 暂未接入（后续可扩展）

### 编码约束（保持一致性）

- 代码只放在 `src/`（入口保留 `main.ts`）
- 当前编译产物为 **CommonJS**（`tsconfig.json`：`module: "commonjs"`）；不要混用 ESM
- 配置解析规则：
  - `agent.workDir/skillsDir/allowedDir` 均以 **config 文件所在目录** 为基准解析为绝对路径（数组会逐项解析）
  - 需要新增配置字段时：先更新 `src/env/ProjectContext.ts` 类型，再更新 `src/config/loadConfig.ts` 校验与默认值
  - 工具配置新增字段时：同步更新 `src/config/loadToolsConfig.ts`

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

- 仓库根目录遗留空目录 `agent/`、`utils/`（已迁移到 `src/`）
- 尚无测试用例；如后续引入测试，优先从配置加载与路径限制（`allowedDir`）开始补
- 更多模拟应用将陆续放入 `src/mockapps`，并通过 `tools.json` 暴露为工具
- 评测 runner（自动执行任务）暂未实现，仅支持评估已生成的结果目录

---

## 3) 模拟应用（Mock Apps）

关于详细的模拟应用实现（包括备忘录 Memo, 相册 Photo, 联系人 Contact 等能力说明与使用方法），请参阅 [`src/mockapps/README.md`](./src/mockapps/README.md)。

---

## 6) 模拟应用规范模板

推荐目录结构：
- `src/mockapps/<appName>/`
- `src/mockapps/<appName>/<AppName>App.ts`

建议包含：
- 应用类（无状态或仅依赖 `workspace/allowedDir(s)`）
- 数据存储目录：`agent.workDir/mockapps/<appName>/`
- 最小功能接口：`read` / `write` / `list`（按需扩展 `append` / `delete` / `search`）

工具接入：
- 在 `src/agent/tools/` 内新增 `<AppName>Tool.ts`
- 工具只调用 mock app 的方法，不直接操作文件
- `tools.json` 中显式注册每个工具（至少包含 `name` / `enabled`）
