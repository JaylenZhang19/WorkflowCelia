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

### 2.3 已接入的本地 tools（23 个）

- `CalendarHandler`：3 个（add/delete/query）
- `CameraHandler`：1 个
- `CallHandler`：1 个
- `ContactHandler`：3 个（add/update/query）
- `FileHandler`：13 个（读写删改查等）
- `MailHandler`：1 个
- `SmsHandler`：1 个

合计：`7` 个 Handler，`23` 个本地工具能力。

## 3. 当前进度（Progress）

### 3.1 已完成

- 统一调用协议：`QueryMessage` / `InvokeResult`
- 本地能力路由和分发框架
- 23 个本地工具能力接入
- 远端能力入口结构预留
- ChatPage 已支持用户输入和 ReAct 步骤可视化展示
- ChatPage 的 `ACTION` 步骤已接入 `GeneralAbilityManager.handleQueryMessage()` 执行 tool 调用
- `Run Test` 按钮已保留用于鸿蒙能力验证

### 3.2 进行中 / 未完成

- `RemoteAbilityManager` 的 IPC 实现（协议映射、超时、重试、错误分层）
- Agent Runtime（最小版）尚未接入
- ReAct 流程仍为 Demo 规则驱动，尚未接入真实 LLM 推理

## 4. 下一阶段：Agent Demo（To-Be，先设计不实现）

目标：在当前能力层之上，做一个可运行的最小 Agent Demo，验证 `skills + tools`。

### 4.1 最小闭环

1. 用户输入
2. Skill 选择（规则匹配即可）
3. 生成工具调用计划（可先由模板/规则生成）
4. 调用已有 tool（走 `GeneralAbilityManager`）
5. 汇总结果并输出

### 4.2 最小新增模块（计划）

- `AgentRuntime`：负责主流程编排
- `SkillRegistry`：维护 skill 定义、触发条件、可用工具白名单
- `ToolRegistry`：对现有能力层做标准化适配
- `SessionStore`：保留最近 N 轮上下文（先本地内存）

说明：以上是下一阶段文档约束，不代表当前代码已实现。

### 4.3 Skill 建议结构

- `id`
- `name`
- `description`
- `when_to_use`
- `instructions`
- `allowed_tools`

### 4.4 Demo 验收标准（最小）

- 至少 2 个 skill 可被触发
- 每个 skill 至少调用 1 个实际 tool
- 返回统一 `InvokeResult` 风格结果（错误场景也一致）
- 全链路可在日志中追踪（请求、路由、执行、返回）
- ChatPage 可见每一步 ReAct 状态与结果（Thought/Skill/Action/Observation/Final）
- 保留并可用 `Run Test` 按钮

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

### 5.5 新增能力流程

1. 在 `LocalCapabilityConfig.ts` 增加能力元数据
2. 在 `abilityhandler/` 创建或扩展 handler（继承基类）
3. 在 `LocalAbilityManager.HANDLER_MAP` 注册
4. 返回值严格符合 `InvokeResult`

### 5.6 错误处理

- 所有失败分支必须 `success: false`
- 必须包含可定位字段（至少 `errorCode` + `error`）
- 禁止仅透传原始异常，需结构化

### 5.7 日志要求

- 关键点必须有日志：入口、路由命中、调用参数摘要、执行结果、异常
- 日志最少包含：`namespace`、`name`、`requestId/traceId`（若有）
- 不记录敏感信息原文（手机号、邮箱、token、文件隐私内容）

### 5.8 兼容与稳定性

- 任何新增字段优先“向后兼容”，不要破坏已存在调用方
- 公共类型改动需同步更新文档与调用点

## 6. 开发边界

当前阶段默认边界如下：
- 不实现复杂推理、多模型轮换、长链路自治
- 不引入重型依赖做“伪智能”
- 优先稳固：协议、路由、工具可用性、错误可观测性

## 7. 里程碑建议

### M1（当前）
- 稳定现有 23 个 tools
- 补齐 Remote IPC 设计与最小实现草图

### M2（下一步）
- 引入最小 `SkillRegistry + AgentRuntime`（规则驱动）
- 打通 2 个 skill 的端到端演示链路

### M3（后续）
- 增加会话管理、权限控制、可观测性完善
- 逐步替换规则驱动为模型驱动

---
最后更新：2026-03-04（ChatPage ReAct 可视化已接入）
