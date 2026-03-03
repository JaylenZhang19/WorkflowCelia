# WorkflowCelia

## 1. 项目是做什么的
WorkflowCelia 是一个基于鸿蒙（HarmonyOS / ArkTS）的 Agent 应用工程。

当前阶段目标不是实现完整 Agent 推理逻辑，而是先把鸿蒙系统能力做成可被统一调用的“工具能力层（Tool Abilities）”，让后续 Agent 可以在应用运行时按报文调用这些能力，完成复杂任务编排。

一句话概括：
- 现在：先打通和标准化“能力调用层”。
- 后续：在这个调用层之上接入 Agent 逻辑。

## 2. 当前实现状态
当前代码已完成“能力工具化”的基础框架，主要包含：
- 统一请求报文结构（`QueryMessage`）和调用结果结构（`InvokeResult`）。
- 本地能力管理与分发（Local）。
- 总入口管理器（General）用于统一路由。
- 示例能力：日历能力（新增/删除/查询事件）。

尚未完成：
- 远端能力调用（Remote）的具体实现。
- Agent 相关决策、规划、推理等核心逻辑。

## 3. 核心模块说明

### 3.1 统一入口（工具调用总入口）
[entry/src/main/ets/abilityprovider/GeneralAbilityManager.ts](/Users/jinglun/repository/DevEcoStudioProjects/WorkflowCelia/entry/src/main/ets/abilityprovider/GeneralAbilityManager.ts)
- 整个工具调用链路的统一入口。
- 负责初始化本地和远端能力集合。
- 对外接收 `QueryMessage`，并路由到对应能力管理器处理。

### 3.2 本地能力入口
[entry/src/main/ets/abilityprovider/LocalAbilityManager.ts](/Users/jinglun/repository/DevEcoStudioProjects/WorkflowCelia/entry/src/main/ets/abilityprovider/LocalAbilityManager.ts)
- 本应用内鸿蒙能力的统一入口。
- 通过 `HANDLER_MAP` 管理各 namespace 对应的 handler。
- 当前已接入 `CalendarHandler`（日历能力）。

### 3.3 外部能力入口
[entry/src/main/ets/abilityprovider/RemoteAbilityManager.ts](/Users/jinglun/repository/DevEcoStudioProjects/WorkflowCelia/entry/src/main/ets/abilityprovider/RemoteAbilityManager.ts)
- 外部应用能力入口（预留）。
- 目前仍是框架占位，未实现具体调用逻辑。

### 3.4 能力定义与报文协议
[entry/src/main/ets/abilityprovider/AbilityTypes.ts](/Users/jinglun/repository/DevEcoStudioProjects/WorkflowCelia/entry/src/main/ets/abilityprovider/AbilityTypes.ts)
- 定义了能力调用请求/响应协议与能力元数据：
- `QueryMessage`：请求头（`namespace` + `name`）与参数载荷。
- `InvokeResult`：统一调用结果格式（成功、输出、错误码等）。
- `MockProviderToolCapability`：工具能力描述（输入、输出、版本、分类等）。

### 3.5 本地能力示例（日历）
[entry/src/main/ets/abilityprovider/localprovider/abilityhandler/CalendarHandler.ts](/Users/jinglun/repository/DevEcoStudioProjects/WorkflowCelia/entry/src/main/ets/abilityprovider/localprovider/abilityhandler/CalendarHandler.ts)
- 封装 CalendarKit 能力。
- 当前支持：`addEvent`、`deleteEvent`、`getEvents`。

## 4. 远端能力（IPC）设计方向
你的目标是通过 IPC 将报文发送到外部应用，实现跨应用能力调用。

建议保持以下原则（仅文档约束，不代表当前已实现）：
- 统一报文协议：远端 IPC 请求体与本地 `QueryMessage` 对齐。
- 统一结果协议：远端返回映射为 `InvokeResult`，确保上层调用无差异。
- 错误码统一：本地错误、远端错误、超时错误使用可区分的错误码。
- 可观测性：为每次调用增加 traceId / requestId，方便排障。

## 5. README 的作用（本项目内）
本 `README.md` 作为团队与 Agent 协作的“项目约束入口文档”，主要作用是：
- 让新接手的人快速理解项目目标与当前边界（做了什么/没做什么）。
- 固化核心入口文件，避免改动时找错位置。
- 约束编码规范，降低后续协作中的风格漂移和返工。
- 作为后续实现 Remote IPC 与 Agent 逻辑时的对齐依据。

## 6. 编码规范（必须遵守）

### 6.1 语言规范
- `ArkUI` 页面与 UI 相关代码使用 `ETS`。
- 除 ArkUI 外，其他业务逻辑代码统一使用 `TypeScript (TS)`。

> 本规范是当前项目最高优先级约束之一：
> **除了 ArkUI 用 ETS 写，其他都要用 TS 写。**

### 6.2 能力开发规范
新增能力时遵循以下流程：
1. 在能力配置中补充工具定义（namespace、name、inputs、outputs）。
2. 为该 namespace 增加或扩展对应 handler。
3. 在 `LocalAbilityManager` 或 `RemoteAbilityManager` 中注册入口。
4. 保证返回值统一为 `InvokeResult`。

### 6.3 路由与协议规范
- 所有能力调用都应以 `QueryMessage` 作为标准输入。
- 不允许在上层直接耦合具体系统 API，必须走 `GeneralAbilityManager` 入口。
- `namespace + name` 作为能力唯一定位键，保持稳定。

### 6.4 错误处理规范
- 失败必须返回 `success: false`，并带 `errorCode` 与 `error`。
- 对外错误信息尽量结构化，避免只返回原始异常字符串。

### 6.5 日志规范
- 关键链路（入口、路由、调用、失败）必须打印日志。
- 日志应包含 `namespace`、`name`、错误原因等最小排障信息。

## 7. 当前开发边界说明
为避免偏离方向，当前阶段默认边界如下：
- 不在此阶段实现 Agent 推理/规划逻辑。
- 优先建设并稳定“能力工具化 + 调用协议 + 路由层”。
- 远端 IPC 调用可在后续阶段按统一协议落地。

## 8. 后续扩展建议（供下一阶段）
- 在 `RemoteAbilityManager` 中实现 IPC 客户端与超时重试机制。
- 增加能力注册发现机制（本地/远端统一能力目录）。
- 增加能力调用测试用例（成功、失败、超时、权限不足）。

---
如果后续代码实现与本文档有冲突，优先同步更新本 `README.md`，保证文档与代码一致。
