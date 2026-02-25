# 外部能力集成文档

## 概述

本文档说明 WorkflowCelia（任务编排中心）如何与 MockAbilityProvider（外部能力提供方）集成，实现短信和邮件发送能力的后台调用。

## 项目结构

```
harmony_repository/
├── WorkflowCelia/              # 任务编排中心
│   └── entry/
│       └── src/main/
│           ├── ets/
│           │   ├── providers/              # 能力提供者 (.ts)
│           │   │   ├── MockSmsAbilityProvider.ts
│           │   │   ├── MockEmailAbilityProvider.ts
│           │   │   └── ExternalAbilityService.ts
│           │   ├── core/engine/
│           │   │   └── BackgroundTaskExecutor.ts
│           │   └── pages/                  # ArkUI 页面 (.ets)
│           │       └── ExternalAbilityDemo.ets
│           └── module.json5
│
└── MockAbilityProvider/        # 能力提供方
    └── entry/
        └── src/main/
            ├── ets/
            │   ├── smsserviceability/        # 短信服务 (.ts)
            │   │   └── SmsServiceAbility.ts
            │   ├── emailserviceability/      # 邮件服务 (.ts)
            │   │   └── EmailServiceAbility.ts
            │   └── pages/                    # ArkUI 页面 (.ets)
            │       └── Index.ets
            └── module.json5
```

**说明：**
- 后端逻辑代码使用 `.ts` 扩展名
- ArkUI 页面使用 `.ets` 扩展名
- 使用 ServiceAbility 实现跨应用调用（避免系统权限限制）

## 能力提供方 (MockAbilityProvider)

### ServiceAbility 配置

MockAbilityProvider 提供两个 ServiceAbility：

| 能力 | ServiceAbility | Action |
|------|---------------|--------|
| 短信 | SmsServiceAbility | action.send.sms |
| 邮件 | EmailServiceAbility | action.send.email |

### 短信能力参数

```typescript
interface SmsSendParams {
  phoneNumber: string;   // 接收方电话号码
  message: string;       // 短信内容
}
```

### 邮件能力参数

```typescript
interface EmailSendParams {
  to: string[];          // 收件人列表
  cc?: string[];         // 抄送人列表
  bcc?: string[];        // 密送人列表
  subject: string;       // 邮件主题
  body: string;          // 邮件正文
  isHtml?: boolean;      // 是否为 HTML 格式
}
```

## 任务编排中心 (WorkflowCelia)

### ExternalAbilityService 使用

```typescript
import { ExternalAbilityService } from './providers/ExternalAbilityService';

// 获取服务实例
const abilityService = ExternalAbilityService.getInstance();

// 初始化服务
await abilityService.initialize(context);

// 发送短信
const smsResult = await abilityService.sendSms({
  phoneNumber: '13800138000',
  message: 'Hello, World!'
});

// 发送邮件
const emailResult = await abilityService.sendEmail({
  to: ['user@example.com'],
  subject: '测试邮件',
  body: '这是一封测试邮件'
});
```

### BackgroundTaskExecutor 使用

```typescript
import { BackgroundTaskExecutor, TaskType } from './core/engine/BackgroundTaskExecutor';

// 获取执行器实例
const taskExecutor = BackgroundTaskExecutor.getInstance();

// 初始化执行器
await taskExecutor.initialize(context);

// 添加短信任务到队列
taskExecutor.addTask({
  type: TaskType.SEND_SMS,
  name: '发送短信',
  inputs: {
    phoneNumber: '13800138000',
    message: 'Hello!'
  }
});

// 添加邮件任务到队列
taskExecutor.addTask({
  type: TaskType.SEND_EMAIL,
  name: '发送邮件',
  inputs: {
    to: ['user@example.com'],
    subject: '测试',
    body: '正文'
  }
});

// 立即执行任务
const task = await taskExecutor.executeTask({
  type: TaskType.SEND_SMS,
  name: '紧急短信',
  inputs: { phoneNumber: '13800138000', message: '紧急!' }
});
```

## 跨应用调用流程

```
┌─────────────────┐     Want      ┌──────────────────────┐
│  WorkflowCelia  │ ────────────> │ MockAbilityProvider  │
│                 │               │                      │
│  EntryAbility   │               │  SmsServiceAbility   │
│       │         │               │  EmailServiceAbility │
│       ▼         │               │                      │
│  ExternalAbility│ ◄──────────── │  Mock Implementation │
│  Service        │    Result     │                      │
│       │         │               │                      │
│       ▼         │               │                      │
│  Background     │               │  Send Records        │
│  Task Executor  │               │                      │
└─────────────────┘               └──────────────────────┘
```

## 调用示例

### 1. 直接调用

```typescript
// 在 Ability 中
import { ExternalAbilityService } from './providers/ExternalAbilityService';

export default class EntryAbility extends UIAbility {
  async onCreate() {
    const service = ExternalAbilityService.getInstance();
    await service.initialize(this.context);
    
    // 发送通知短信
    await service.sendSms({
      phoneNumber: '13800138000',
      message: '任务完成通知'
    });
  }
}
```

### 2. 工作流集成

```typescript
// 在工作流节点中
import { BackgroundTaskExecutor, TaskType } from './core/engine/BackgroundTaskExecutor';

async function executeWorkflowNode(workflowContext: any) {
  const executor = BackgroundTaskExecutor.getInstance();
  
  // 根据工作流配置添加任务
  if (workflowContext.nodeType === 'sms_notification') {
    executor.addTask({
      type: TaskType.SEND_SMS,
      name: '发送通知短信',
      inputs: workflowContext.inputs
    });
  } else if (workflowContext.nodeType === 'email_notification') {
    executor.addTask({
      type: TaskType.SEND_EMAIL,
      name: '发送通知邮件',
      inputs: workflowContext.inputs
    });
  }
}
```

## 权限配置

### WorkflowCelia 权限

WorkflowCelia 不需要特殊权限，通过 Want 的 action 匹配调用服务。

### MockAbilityProvider 权限

在 `module.json5` 中配置 abilities 的 permissions：

```json5
"abilities": [
  {
    "name": "SmsServiceAbility",
    "permissions": ["ohos.permission.SEND_MESSAGES"]
  },
  {
    "name": "EmailServiceAbility",
    "permissions": ["ohos.permission.INTERNET"]
  }
]
```

**注意：** 这里使用 ServiceAbility 而不是 ExtensionAbility，因为：
1. ExtensionAbility 的 sms/email 类型需要系统权限
2. ServiceAbility 可以通过 action 匹配实现跨应用调用
3. 普通应用可以直接使用，无需特殊 APL 等级

## 演示页面

### WorkflowCelia

访问 `pages/ExternalAbilityDemo` 页面测试：
- 短信发送（立即发送/加入队列）
- 邮件发送（立即发送/加入队列）
- 任务队列管理

### MockAbilityProvider

访问主页面查看：
- 可用能力列表
- 技术信息
- 服务状态

## 扩展说明

### 添加新的能力提供方

1. 在 MockAbilityProvider 中创建新的 ExtensionAbility
2. 在 module.json5 中注册
3. 在 WorkflowCelia 中创建对应的 AbilityProvider
4. 在 ExternalAbilityService 中集成

### 真实场景替换

当前实现为 Mock 版本，真实场景中：
1. 短信能力应由短信应用提供
2. 邮件能力应由邮件应用提供
3. 各应用独立部署，通过 Want 机制通信

## 注意事项

1. 确保 MockAbilityProvider 已安装
2. 检查跨应用调用权限
3. 后台任务需要考虑应用生命周期
4. Mock 实现不实际发送短信/邮件

## 文件清单

### MockAbilityProvider 新增文件
- `entry/src/main/ets/smsserviceability/SmsServiceAbility.ts`
- `entry/src/main/ets/emailserviceability/EmailServiceAbility.ts`

### WorkflowCelia 新增文件
- `entry/src/main/ets/providers/MockSmsAbilityProvider.ts`
- `entry/src/main/ets/providers/MockEmailAbilityProvider.ts`
- `entry/src/main/ets/providers/ExternalAbilityService.ts`
- `entry/src/main/ets/core/engine/BackgroundTaskExecutor.ts`
- `entry/src/main/ets/pages/ExternalAbilityDemo.ets`（ArkUI 页面）
