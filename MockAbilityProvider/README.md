# MockAbilityProvider

鸿蒙能力提供者模拟应用 - 为 WorkflowCelia 提供可测试的跨应用能力

## 简介

MockAbilityProvider 是一个模拟应用，用于演示如何为 HarmonyOS 应用提供可被其他应用发现和调用的能力。它实现了 AbilityLink SDK 的 Provider 接口，提供模拟的短信和邮件发送能力。

## 日志规范

项目统一使用 `MockAbilityProvider/entry/src/main/ets/utils/Logger.ts` 中的 `logger` 进行日志输出，避免分散域名导致日志难以检索。

### 核心特性

- 🔌 **AbilityLink 集成** - 完整实现 AbilityLink Provider 接口
- 📱 **短信能力模拟** - 模拟短信发送功能
- 📧 **邮件能力模拟** - 模拟邮件发送功能
- 📝 **元数据声明** - 在 module.json5 中声明能力元数据
- 🧪 **开发测试** - 用于测试 WorkflowCelia 的能力发现与调用

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                   MockAbilityProvider                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  EntryAbility                                         │  │
│  │  - 应用主入口                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Extension Abilities                                  │  │
│  │  ┌─────────────────┐  ┌─────────────────┐            │  │
│  │  │ SmsService      │  │ EmailService    │            │  │
│  │  │ Ability         │  │ Ability         │            │  │
│  │  │                 │  │                 │            │  │
│  │  │ ┌─────────────┐ │  │ ┌─────────────┐ │            │  │
│  │  │ │SmsAbility   │ │  │ │EmailAbility │ │            │  │
│  │  │ │Provider     │ │  │ │Provider     │ │            │  │
│  │  │ └─────────────┘ │  │ └─────────────┘ │            │  │
│  │  └─────────────────┘  └─────────────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AbilityLink SDK                                      │  │
│  │  - AbilityLinkProvider                                │  │
│  │  - 能力元数据定义                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐   ┌─────────────────┐   ┌───────────────┐
│ module.json5  │   │  Want 调用      │   │  能力元数据   │
│ 元数据声明    │   │  处理           │   │  JSON 配置     │
└───────────────┘   └─────────────────┘   └───────────────┘
```

## 项目结构

```
MockAbilityProvider/
├── entry/src/main/ets/
│   ├── entryability/
│   │   └── EntryAbility.ets         # 应用主入口
│   │
│   ├── smsserviceability/
│   │   └── SmsServiceAbility.ts     # 短信服务能力
│   │       ├── SMS_CAPABILITY       # 能力元数据定义
│   │       └── SmsAbilityProvider   # Provider 实现
│   │
│   ├── emailserviceability/
│   │   └── EmailServiceAbility.ts   # 邮件服务能力
│   │       ├── EMAIL_CAPABILITY     # 能力元数据定义
│   │       └── EmailAbilityProvider # Provider 实现
│   │
│   └── pages/
│       └── Index.ets                # 主页面
│
├── entry/src/main/
│   └── module.json5                 # 模块配置与能力元数据声明
│
└── entry/
    └── oh-package.json5             # 依赖配置 (包含 ability_link HAR)
```

## 依赖 AbilityLink SDK

本应用使用 WorkflowCelia 项目中的 `ability_link` HAR 模块：

```json5
// entry/oh-package.json5
{
  "dependencies": {
    "ability_link": "file:../WorkflowCelia/ability_link"
  }
}
```

### 构建顺序

1. 先构建 `WorkflowCelia/ability_link` 模块生成 HAR 包
2. 再构建 `MockAbilityProvider` 应用

## 能力定义

### 短信能力 (sms.send)

| 属性 | 值 |
|------|-----|
| **名称** | sms.send |
| **显示名** | 发送短信 |
| **描述** | 发送短信到指定号码 |
| **类别** | communication |
| **版本** | 1.0.0 |

**输入参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| phoneNumber | string | 是 | 接收方电话号码 |
| message | string | 是 | 短信内容 |

**输出参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| success | boolean | 是否发送成功 |
| messageId | string | 消息 ID |

### 邮件能力 (email.send)

| 属性 | 值 |
|------|-----|
| **名称** | email.send |
| **显示名** | 发送邮件 |
| **描述** | 发送电子邮件到指定收件人 |
| **类别** | communication |
| **版本** | 1.0.0 |

**输入参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| to | array | 是 | 收件人列表 |
| subject | string | 是 | 邮件主题 |
| body | string | 是 | 邮件正文 |
| cc | array | 否 | 抄送人列表 |
| bcc | array | 否 | 密送人列表 |
| isHtml | boolean | 否 | 是否为 HTML 格式 |

**输出参数：**

| 参数 | 类型 | 描述 |
|------|------|------|
| success | boolean | 是否发送成功 |
| messageId | string | 消息 ID |

## 快速开始

### 1. 添加 SDK 依赖

在 `entry/oh-package.json5` 中：

```json5
{
  "name": "entry",
  "version": "1.0.0",
  "dependencies": {
    "@ability-link/sdk": "file:../ability-link-sdk"
  }
}
```

### 2. 定义能力

```typescript
import {
  AbilityLinkCapability,
  AbilityCategory,
  CapabilityDataType
} from '@ability-link/sdk';

export const SMS_CAPABILITY: AbilityLinkCapability = {
  name: 'sms.send',
  displayName: '发送短信',
  description: '发送短信到指定号码',
  version: '1.0.0',
  category: AbilityCategory.COMMUNICATION,
  inputs: [
    {
      name: 'phoneNumber',
      type: CapabilityDataType.STRING,
      required: true,
      description: '接收方电话号码'
    },
    {
      name: 'message',
      type: CapabilityDataType.STRING,
      required: true,
      description: '短信内容'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: CapabilityDataType.BOOLEAN,
      required: true,
      description: '是否发送成功'
    },
    {
      name: 'messageId',
      type: CapabilityDataType.STRING,
      required: false,
      description: '消息 ID'
    }
  ],
  permissions: ['ohos.permission.SEND_MESSAGES'],
  requiresConfirmation: false
};
```

### 3. 实现 Provider

```typescript
import {
  AbilityLinkProvider,
  InvokeResult
} from '@ability-link/sdk';

class SmsAbilityProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return SMS_CAPABILITY;
  }

  async invoke(inputs: Record<string, any>): Promise<InvokeResult> {
    // 验证输入
    const validation = this.validateInputs(inputs);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        errorCode: 'INVALID_PARAMETERS'
      };
    }

    const { phoneNumber, message } = inputs;

    // 实现短信发送逻辑
    // ...

    return {
      success: true,
      outputs: {
        success: true,
        messageId: `SMS_${Date.now()}`
      },
      metadata: {
        provider: 'MockAbilityProvider',
        capability: 'sms.send'
      }
    };
  }
}
```

### 4. 创建 ExtensionAbility

```typescript
import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { SmsAbilityProvider } from '../providers/SmsAbilityProvider';

export default class SmsServiceAbility extends AppServiceExtensionAbility {
  private provider: SmsAbilityProvider;

  onCreate(): void {
    this.provider = new SmsAbilityProvider();
  }

  onDestroy(): void {
    this.provider.dispose();
  }

  async onStartCommand(want: Want, startId: number): Promise<void> {
    const result = await this.provider.invoke(want.parameters);
    // 处理结果
  }
}
```

### 5. 配置 module.json5

```json5
{
  "module": {
    "extensionAbilities": [
      {
        "name": "SmsServiceAbility",
        "srcEntry": "./ets/smsserviceability/SmsServiceAbility.ts",
        "type": "appService",
        "exported": true,
        "permissions": ["ohos.permission.SEND_MESSAGES"],
        "skills": [
          {
            "actions": ["action.send.sms"]
          }
        ],
        "metadata": [
          {
            "name": "ability-link.capability",
            "value": "{\"name\":\"sms.send\",\"displayName\":\"发送短信\",\"description\":\"发送短信到指定号码\",\"version\":\"1.0.0\",\"category\":\"communication\",\"inputs\":[{\"name\":\"phoneNumber\",\"type\":\"string\",\"required\":true,\"description\":\"接收方电话号码\"},{\"name\":\"message\",\"type\":\"string\",\"required\":true,\"description\":\"短信内容\"}],\"outputs\":[{\"name\":\"success\",\"type\":\"boolean\",\"required\":true,\"description\":\"是否发送成功\"},{\"name\":\"messageId\",\"type\":\"string\",\"required\":false,\"description\":\"消息 ID\"}],\"permissions\":[\"ohos.permission.SEND_MESSAGES\"],\"requiresConfirmation\":false}"
          }
        ]
      }
    ]
  }
}
```

## 使用示例

### 被 WorkflowCelia 调用

安装 MockAbilityProvider 后，WorkflowCelia 会通过 IPC 接收其能力注册：

```typescript
// WorkflowCelia 中的代码
import { AbilityLinkService } from './services/AbilityLinkService';

const service = AbilityLinkService.getInstance();

// 获取已注册能力
const capabilities = service.getAllCapabilities()
  .filter(cap => cap.bundleName === 'com.pumpkin.mockabilityprovider');

// capabilities 将包含：
// - sms.send
// - email.send

// 调用短信能力
const result = await service.invokeCapability(
  'com.pumpkin.mockabilityprovider',
  'sms.send',
  {
    phoneNumber: '12345678',
    message: 'Hello from WorkflowCelia'
  }
);

console.log(result.success); // true
console.log(result.outputs.messageId); // SMS_xxxxx
```

### 直接通过 Want 调用

```typescript
import { common, Want } from '@kit.AbilityKit';

async function sendSms(context: common.UIAbilityContext) {
  const want: Want = {
    bundleName: 'com.pumpkin.mockabilityprovider',
    abilityName: 'SmsServiceAbility',
    action: 'action.send.sms',
    parameters: {
      phoneNumber: '12345678',
      message: 'Hello'
    }
  };

  await context.startAbility(want);
}
```

## 添加新能力

### 步骤 1: 定义能力元数据

```typescript
export const NEW_CAPABILITY: AbilityLinkCapability = {
  name: 'my.new_action',
  displayName: '新能力',
  description: '这是一个新能力',
  version: '1.0.0',
  category: AbilityCategory.CUSTOM,
  inputs: [
    {
      name: 'param1',
      type: CapabilityDataType.STRING,
      required: true,
      description: '参数 1'
    }
  ],
  outputs: [
    {
      name: 'result',
      type: CapabilityDataType.STRING,
      required: true,
      description: '执行结果'
    }
  ],
  permissions: [],
  requiresConfirmation: false
};
```

### 步骤 2: 创建 Provider

```typescript
class NewAbilityProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return NEW_CAPABILITY;
  }

  async invoke(inputs: Record<string, any>): Promise<InvokeResult> {
    const validation = this.validateInputs(inputs);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 实现能力逻辑
    const { param1 } = inputs;
    // ...

    return {
      success: true,
      outputs: { result: '操作成功' },
      metadata: { provider: 'MockAbilityProvider', capability: 'my.new_action' }
    };
  }
}
```

### 步骤 3: 创建 ExtensionAbility

```typescript
export default class NewServiceAbility extends AppServiceExtensionAbility {
  private provider: NewAbilityProvider;

  onCreate(): void {
    this.provider = new NewAbilityProvider();
  }

  onDestroy(): void {
    this.provider.dispose();
  }

  async onStartCommand(want: Want, startId: number): Promise<void> {
    const result = await this.provider.invoke(want.parameters);
    // 处理结果
  }
}
```

### 步骤 4: 更新 module.json5

添加新的 extensionAbility 条目，包含 `ability-link.capability` 元数据。

## 构建和运行

### 环境要求

- DevEco Studio 4.0+
- HarmonyOS SDK API 12+

### 构建步骤

1. 使用 DevEco Studio 打开项目
2. 安装依赖：`ohpm install`
3. 连接设备或启动模拟器
4. 运行到设备

### 与 WorkflowCelia 联调

1. 同时安装 MockAbilityProvider 和 WorkflowCelia
2. 打开 WorkflowCelia
3. 进入 AbilityLink Demo 页面
4. 点击 "Refresh List"
5. 验证 MockAbilityProvider 的能力出现在列表中
6. 选择能力并测试调用

## 能力元数据格式

`module.json5` 中的元数据使用 JSON 格式：

```json
{
  "name": "ability-link.capability",
  "value": "{\"name\":\"sms.send\",\"displayName\":\"发送短信\",\"description\":\"发送短信到指定号码\",\"version\":\"1.0.0\",\"category\":\"communication\",\"inputs\":[],\"outputs\":[],\"permissions\":[],\"requiresConfirmation\":false}"
}
```

### 生成元数据

使用 SDK 提供的辅助函数：

```typescript
import { createAbilityLinkMetadata } from '@ability-link/sdk';

const metadata = createAbilityLinkMetadata(SMS_CAPABILITY);
// 将 metadata 添加到 module.json5
```

## 最佳实践

### 1. 能力命名

- 使用 `domain.action` 格式
- 避免命名冲突
- 示例：`sms.send`, `email.send`, `calendar.create_event`

### 2. 权限管理

- 在能力元数据中声明所需权限
- 在 `module.json5` 中声明权限
- 运行时检查权限

### 3. 错误处理

- 提供清晰的错误码
- 验证所有输入参数
- 记录详细日志

### 4. 日志记录

```typescript
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x1000;
const TAG = 'SmsServiceExtension';

hilog.info(DOMAIN, TAG, 'SMS sent to %{public}s', phoneNumber);
hilog.error(DOMAIN, TAG, 'Failed: %{public}s', errorMessage);
```

## 故障排除

### 能力未被发现

- 检查 `module.json5` 元数据格式是否正确
- 确保 `exported: true`
- 验证能力类别是否有效
- 重新安装应用

### 调用失败

- 检查 Want 的 bundleName 和 abilityName
- 验证输入参数类型
- 查看 hilog 日志

### 查看日志

```bash
# 查看 MockAbilityProvider 日志
hdc shell hilog | grep "SmsService\|EmailService"
```

## 许可证

Apache-2.0

## 相关链接

- [AbilityLink SDK 文档](../ability-link-sdk/README.md)
- [集成指南](../INTEGRATION_GUIDE.md)
- [WorkflowCelia](../WorkflowCelia/README.md)
