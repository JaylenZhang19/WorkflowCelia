# WorkflowCelia

本文件是当前项目的唯一基线文档，定义三件事：
- 当前架构是什么（Architecture）
- 当前做到哪一步（Progress）
- 开发必须遵守什么规范（Coding Notes）

如果代码实现与本文档冲突，以“先更新文档再改代码”为原则，保持一致性。

## 1. 项目目标

WorkflowCelia 是一个基于 HarmonyOS（ArkTS）的 Agent 工程。

当前目标分两层：
- 第 1 层（已在做）：把鸿蒙系统能力封装成可路由、可调用、可扩展的 `tools` 能力层。
- 第 2 层（下一阶段）：在 tools 之上接入一个简化的 Agent Runtime，用于 Demo 验证 `skills + tools` 流程。

当前不追求完整 ReAct/多模型编排，只做“可验证闭环”。

## 2. 当前架构（As-Is）

### 2.1 总体架构

调用链路（当前）：
1. 上层构造 `QueryMessage`
2. 进入 `GeneralAbilityManager`
3. 路由到 `LocalAbilityManager` 或 `RemoteAbilityManager`
4. 命中具体 Handler
5. 返回统一 `InvokeResult`

### 2.2 核心模块

- 统一入口  
  `entry/src/main/ets/abilityprovider/GeneralAbilityManager.ts`  
  负责统一接收请求和分发到本地/远端能力管理器。

- 本地能力管理  
  `entry/src/main/ets/abilityprovider/LocalAbilityManager.ts`  
  通过 `HANDLER_MAP` 维护 namespace 与 handler 的映射关系。

- 远端能力管理（占位）  
  `entry/src/main/ets/abilityprovider/RemoteAbilityManager.ts`  
  当前仅有框架，尚未落地 IPC 调用。

- 协议与类型  
  `entry/src/main/ets/abilityprovider/AbilityTypes.ts`  
  定义 `QueryMessage`、`InvokeResult`、能力元数据与相关枚举。

- 本地能力配置  
  `entry/src/main/ets/abilityprovider/localprovider/LocalCapabilityConfig.ts`  
  管理本地 tool 能力定义和查询辅助方法。

- 本地能力处理器目录  
  `entry/src/main/ets/abilityprovider/localprovider/abilityhandler/`

- 用户交互主页面  
  `entry/src/main/ets/pages/ChatPage.ets`  
  负责用户输入和 Agent 消息展示。当前已支持 ReAct 可视化步骤输出：
  `THOUGHT -> SKILL -> ACTION -> OBSERVATION -> FINAL`。  
  页面顶部保留 `Run Test` 按钮，作为鸿蒙能力测试入口，不可移除。

- Agent Runtime 模块（逐步落地中）  
  以 `entry/src/main/ets/agent/` 为主目录，包含最小可运行结构：
  `SkillLoader`、`ToolsManager`、`LocalAgent` 等。

- 运行环境与配置上下文  
  `entry/src/main/ets/env/ProjectContext.ts`  
  `entry/src/main/ets/env/HarmonyProjectContext.ts`  
  负责运行环境判断与模型配置初始化（Harmony/Node 统一入口）。

- 双端日志适配  
  `entry/src/main/ets/utils/Logger.ts`  
  logger 内部根据 `ProjectContext` 选择 Harmony hilog 或 Node console。

### 2.3 已接入的本地 tools（23 个）

- `CalendarHandler`：3 个（add/delete/query）
- `CameraHandler`：1 个
- `CallHandler`：1 个
- `ContactHandler`：3 个（add/update/query）
- `FileHandler`：13 个（读写删改查等）
- `MailHandler`：1 个
- `SmsHandler`：1 个

合计：`7` 个 Handler，`23` 个本地工具能力。

## 3. 双端运行（HarmonyOS + Node.js）

目标：同一套 TS 业务逻辑既能在鸿蒙真机运行，也能在 Node.js 环境用于评测。

### 3.1 HarmonyOS 入口

- 入口文件：`entry/src/main/ets/entryability/EntryAbility.ts`
- 初始化上下文：`initProjectContextForHarmony(this.context)`
- 配置来源：`entry/src/main/resources/rawfile/app_config.json`

### 3.2 Node.js 入口

- 入口文件：`node-entry.ts`
- 配置来源：默认 `process.cwd()/app_config.json`
- 也可通过 `WORKFLOW_CELIA_CONFIG` 指定配置文件路径

### 3.3 配置格式

`app_config.json` 示例：
```json
{
  "model": {
    "apiKey": "",
    "apiUrl": "http://127.0.0.1:11435/v1/chat/completions",
    "modelName": "Qwen2-72B-Instruct-GPTQ-Int4"
  }
}
```

### 3.4 LLM 配置生效点

- `entry/src/main/ets/LlmClient.ts`
- 从 `ProjectContext` 读取 `apiKey/apiUrl/modelName`
- 若未初始化上下文则沿用默认值

## 4. 当前进度（Progress）

### 4.1 已完成

- 统一调用协议：`QueryMessage` / `InvokeResult`
- 本地能力路由和分发框架
- 23 个本地工具能力接入
- 远端能力入口结构预留
- ChatPage 已支持用户输入和 ReAct 步骤可视化展示
- ChatPage 的 `ACTION` 步骤已接入 `GeneralAbilityManager.handleQueryMessage()` 执行 tool 调用
- `Run Test` 按钮已保留用于鸿蒙能力验证
- 初步 Agent 运行结构接入（`agent/` 目录）
- 运行环境上下文与双端日志适配
- Node.js 入口可初始化上下文，支持评测流程

### 4.2 进行中 / 未完成

- `RemoteAbilityManager` 的 IPC 实现（协议映射、超时、重试、错误分层）
- Agent Runtime 仍为最小版本，缺上下文压缩和容错机制
- Node 侧尚未完成对所有 `@ohos` 依赖的完整替换/适配层

## 5. 编码注意事项（必须遵守）

### 5.1 语言边界

- ArkUI 页面/UI 代码使用 `ETS`
- 非 UI 业务逻辑统一使用 `TypeScript`

硬性规则：除 ArkUI 外，不新增 ETS 业务逻辑代码。

### 5.2 协议一致性

- 所有能力调用一律使用 `QueryMessage` 输入
- 所有调用结果一律返回 `InvokeResult`
- `namespace + name` 是稳定能力标识，禁止随意变更

### 5.3 路由边界

- 不允许上层绕过管理器直接调用系统 API
- 必须走 `GeneralAbilityManager -> Local/RemoteAbilityManager -> Handler`

### 5.4 ChatPage 交互约束

- 用户与 Agent 的交互统一在 `ChatPage.ets`
- 每次用户输入后，必须可见完整 ReAct 步骤（Thought/Skill/Action/Observation/Final）
- `Run Test` 按钮是固定验证入口，后续迭代不得删除
- ReAct 的 `Action` 步骤如涉及工具调用，必须走 `GeneralAbilityManager`

### 5.5 Skill 规范约束

- Skill 必须以 `SKILL.md` 表达，包含 YAML frontmatter + Markdown body
- frontmatter 至少包含 `name` 和 `description`
- `name` 需满足：1-64 字符、小写字母数字和连字符、与目录名一致
- `allowed-tools` 用于工具白名单约束，Agent 执行前必须校验
- 运行时遵循 progressive disclosure：先看 metadata，再激活并读取完整指令

### 5.6 新增能力流程

1. 在 `LocalCapabilityConfig.ts` 增加能力元数据
2. 在 `abilityhandler/` 创建或扩展 handler（继承基类）
3. 在 `LocalAbilityManager.HANDLER_MAP` 注册
4. 返回值严格符合 `InvokeResult`

### 5.7 错误处理

- 所有失败分支必须 `success: false`
- 必须包含可定位字段（至少 `errorCode` + `error`）
- 禁止仅透传原始异常，需结构化

### 5.8 日志要求

- 关键点必须有日志：入口、路由命中、调用参数摘要、执行结果、异常
- 日志最少包含：`namespace`、`name`、`requestId/traceId`（若有）
- 不记录敏感信息原文（手机号、邮箱、token、文件隐私内容）

### 5.9 兼容与稳定性

- 新增 Node 运行路径时，不得引入 `@ohos` 依赖到 Node 代码路径
- Harmony 与 Node 逻辑要共享同一套核心 TypeScript 代码

## 6. 给 Codex/AI 的说明（下次重开 session 必读）

你必须先阅读本 README，再进行任何改动。关键上下文如下：

- 本项目是 HarmonyOS + Node.js 双端可运行的 Agent 框架，用于评测模型和 skill 能力。
- 双端入口已存在：
  - Harmony：`entry/src/main/ets/entryability/EntryAbility.ts` 初始化 `ProjectContext`
  - Node：`node-entry.ts` 初始化 `ProjectContext`
- 运行环境判断和配置读取由 `entry/src/main/ets/env/ProjectContext.ts` 统一管理。
- LLM 调用从 `ProjectContext` 读取 `apiKey/apiUrl/modelName`。
- logger 已支持 Harmony/Node 自适配，外部不得感知环境。

请遵守：
- 任何与架构冲突的改动，必须先更新本 README。
- 保持 TypeScript 逻辑可在两端复用，不在 Node 路径引入 `@ohos` 依赖。
- ChatPage 的 `Run Test` 按钮不可移除。
