# WorkflowCelia

鸿蒙工作流自动化引擎 - 通过动态能力发现与调用，实现跨应用任务自动化执行

## 简介

WorkflowCelia 是一个 HarmonyOS 工作流自动化平台，能够发现并调用其他应用提供的能力，实现复杂任务的自动化执行。

### 核心特性

- 🔍 **动态能力发现** - 自动发现已安装应用提供的能力，无需硬编码
- 🔌 **插件式架构** - 基于 AbilityLink SDK，新应用集成后自动可用
- 🔄 **跨应用调用** - 无缝调用第三方应用能力
- 📋 **工作流编排** - 将多个能力组合成自动化工作流

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      WorkflowCelia                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI Layer (pages/)                                    │  │
│  │  - 工作流列表 / 编辑器 / AbilityLink Demo             │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Services Layer                                       │  │
│  │  - AbilityLinkService (能力发现与调用)                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Core Engine (core/)                                  │  │
│  │  - WorkflowEngine / ActionRegistry / TypeConverter    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AbilityLink SDK                                      │  │
│  │  - 能力发现 / 协议解析 / 跨应用通信                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐   ┌─────────────────┐   ┌───────────────┐
│ MockAbility   │   │  系统应用       │   │  第三方应用   │
│ Provider      │   │  (短信/邮件等)  │   │  (日历/天气等)│
└───────────────┘   └─────────────────┘   └───────────────┘
```

## 项目结构

```
WorkflowCelia/
├── entry/src/main/ets/
│   ├── core/                      # 核心引擎
│   │   ├── models/                # 数据模型
│   │   │   ├── DataType.ts        # 数据类型定义
│   │   │   ├── Action.ts          # 动作定义
│   │   │   ├── Workflow.ts        # 工作流定义
│   │   │   └── WorkflowContext.ts # 执行上下文
│   │   ├── engine/                # 核心引擎
│   │   │   ├── ActionRegistry.ts  # 动作注册中心
│   │   │   ├── ContentGraphEngine.ts # 类型转换引擎
│   │   │   └── WorkflowEngine.ts  # 工作流执行引擎
│   │   └── actions/               # 内置动作
│   │       ├── ScriptingActions.ts
│   │       ├── SystemActions.ts
│   │       └── ...
│   │
│   ├── services/                  # 服务层 (新增)
│   │   └── AbilityLinkService.ts  # AbilityLink 服务封装
│   │
│   ├── providers/                 # 能力提供者
│   │   ├── system/                # 系统能力
│   │   ├── photos/                # 照片能力
│   │   ├── calendar/              # 日历能力
│   │   └── notification/          # 通知能力
│   │
│   └── pages/                     # UI 界面
│       ├── Index.ets
│       ├── WorkflowsList.ets
│       └── AbilityLinkDemo.ets    # 能力发现演示页面
│
├── ability_link/              # AbilityLink SDK (HAR 包)
│   ├── src/main/ets/
│   │   ├── types.ts           # 核心类型定义 (TypeScript)
│   │   ├── ProviderHelper.ts  # Provider 辅助类 (TypeScript)
│   │   └── Consumer.ts        # Consumer SDK (TypeScript)
│   ├── Index.ets              # SDK 入口 (ETS)
│   ├── oh-package.json5       # 包配置
│   └── README.md              # SDK 文档
│
└── entry/
    └── oh-package.json5           # 依赖配置
```

## 快速开始

### 1. 初始化 AbilityLink SDK

在 `EntryAbility` 中已自动初始化：

```typescript
import { AbilityLinkService } from './services/AbilityLinkService';

async onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): Promise<void> {
  const abilityLinkService = AbilityLinkService.getInstance();
  await abilityLinkService.initialize(this.context);
}
```

### 2. 发现可用能力

```typescript
import { AbilityLinkService } from './services/AbilityLinkService';

const service = AbilityLinkService.getInstance();

// 发现所有能力
const capabilities = await service.discoverCapabilities();

// 按类别过滤
const communicationCapabilities = await service.discoverCapabilities({
  category: 'communication'
});

// 按应用过滤
const mockCapabilities = await service.discoverCapabilities({
  bundleName: 'com.pumpkin.mockabilityprovider'
});
```

### 3. 调用能力

```typescript
// 发送短信
const smsResult = await service.invokeCapability(
  'com.pumpkin.mockabilityprovider',
  'sms.send',
  {
    phoneNumber: '12345678',
    message: 'Hello from WorkflowCelia'
  }
);

// 发送邮件
const emailResult = await service.invokeCapability(
  'com.pumpkin.mockabilityprovider',
  'email.send',
  {
    to: ['user@example.com'],
    subject: 'Test Email',
    body: 'This is a test email'
  }
);
```

### 4. 监听事件

```typescript
import { AbilityLinkEvent } from '@ability-link/sdk';

const consumer = AbilityLinkConsumer.getInstance();

// 监听新能力发现
consumer.on(AbilityLinkEvent.CAPABILITY_DISCOVERED, (data) => {
  console.log('发现新能力:', data.bundleName, data.capabilityName);
});

// 监听调用完成
consumer.on(AbilityLinkEvent.INVOCATION_COMPLETE, (data) => {
  console.log('调用完成:', data.success);
});
```

## 核心模块

### AbilityLinkService

统一管理能力的发现与调用：

| 方法 | 功能 |
|------|------|
| `initialize(context)` | 初始化 SDK |
| `discoverCapabilities(filter?)` | 发现能力 |
| `getAllCapabilities(filter?)` | 获取已发现的能力 |
| `invokeCapability(bundle, name, inputs)` | 调用能力 |
| `refreshCapabilities()` | 刷新能力列表 |
| `dispose()` | 释放资源 |

### AbilityLink SDK

| 模块 | 功能 |
|------|------|
| `AbilityLinkConsumer` | 能力发现与调用核心 |
| `AbilityLinkProvider` | Provider 基类 |
| `MultiCapabilityProvider` | 多能力 Provider 基类 |
| `AbilityCategory` | 能力类别枚举 |
| `CapabilityDataType` | 数据类型枚举 |
| `AbilityLinkEvent` | 事件类型 |

### 能力类别

| 类别 | 说明 |
|------|------|
| `system` | 系统能力 |
| `communication` | 通信能力（短信、邮件） |
| `media` | 媒体能力 |
| `location` | 位置能力 |
| `calendar` | 日历能力 |
| `contacts` | 联系人能力 |
| `health` | 健康能力 |
| `smart_home` | 智能家居 |
| `productivity` | 生产力工具 |
| `finance` | 金融服务 |
| `shopping` | 购物应用 |
| `entertainment` | 娱乐应用 |
| `custom` | 自定义能力 |

## 使用示例

### 创建工作流

```typescript
import {
  createWorkflow,
  createActionNode,
  WorkflowEngine
} from './core/index';
import { AbilityLinkService } from './services/AbilityLinkService';

// 创建工作流：获取电量 → 发送通知
const workflow = createWorkflow('Battery Alert');
workflow.actions = [
  createActionNode('get_battery_level', '获取电量'),
  createActionNode('conditional', '如果电量 < 20%', {
    condition: '${battery} < 20',
    then: [
      createActionNode('show_notification', '显示低电量通知')
    ]
  })
];

// 执行工作流
const engine = WorkflowEngine.getInstance();
const result = await engine.execute(workflow);
```

### 集成跨应用能力

```typescript
// 创建工作流：发现能力 → 调用能力
const workflow = createWorkflow('Send Morning Message');
workflow.actions = [
  {
    type: 'custom',
    execute: async (context) => {
      const service = AbilityLinkService.getInstance();
      
      // 发现短信能力
      const capabilities = await service.discoverCapabilities({
        category: 'communication'
      });
      
      const smsCap = capabilities.find(c => c.capabilityName === 'sms.send');
      
      if (smsCap) {
        // 调用短信能力
        await service.invokeCapability(
          smsCap.bundleName,
          smsCap.capabilityName,
          {
            phoneNumber: '12345678',
            message: 'Good morning!'
          }
        );
      }
    }
  }
];
```

### AbilityLink Demo 页面

应用内提供了演示页面用于测试能力发现与调用：

1. 打开应用
2. 导航到 AbilityLink Demo 页面
3. 点击 "Discover Capabilities"
4. 选择发现的能力
5. 填写参数并调用

## 集成新应用

当新的应用集成 AbilityLink SDK 后，WorkflowCelia 会自动发现其能力。

### Provider 应用集成步骤

1. 在应用中添加 AbilityLink SDK 依赖
2. 定义能力元数据
3. 继承 `AbilityLinkProvider` 实现能力
4. 在 `module.json5` 中声明能力元数据

详细指南请参考 [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)

### 示例：添加天气应用

天气应用集成后，WorkflowCelia 会自动发现 `weather.get_current` 能力：

```typescript
// 无需修改 WorkflowCelia 代码
const service = AbilityLinkService.getInstance();

// 天气能力会自动出现在发现列表中
const capabilities = await service.discoverCapabilities();
const weatherCap = capabilities.find(c => c.capabilityName === 'weather.get_current');

// 直接调用
await service.invokeCapability(
  'com.example.weather',
  'weather.get_current',
  { city: 'Beijing' }
);
```

## 构建和运行

### 环境要求

- DevEco Studio 4.0+
- HarmonyOS SDK API 12+
- Node.js 16+

### 构建步骤

1. 使用 DevEco Studio 打开项目
2. 安装依赖：`ohpm install`
3. 连接设备或启动模拟器
4. 运行到设备

### 测试

```bash
# 运行单元测试
ohpm test

# 运行 lint 检查
ohpm run lint
```

## 与 MockAbilityProvider 配合使用

开发测试时，建议安装 MockAbilityProvider 应用：

1. MockAbilityProvider 提供模拟的短信和邮件能力
2. 无需真实系统权限即可测试
3. 可以验证能力发现与调用流程

## 故障排除

### 能力未被发现

- 确保 Provider 应用已安装
- 检查 `module.json5` 中的元数据格式
- 验证 ExtensionAbility 的 `exported` 为 `true`
- 尝试刷新能力列表

### 调用失败

- 检查目标应用是否运行
- 验证输入参数类型和必填项
- 查看 hilog 日志获取详细错误

### 日志查看

```bash
# 查看 AbilityLink 相关日志
hdc shell hilog | grep "AbilityLink"
```

## 许可证

Apache-2.0

## 相关链接

- [AbilityLink SDK 文档](./ability-link-sdk/README.md)
- [集成指南](../INTEGRATION_GUIDE.md)
- [MockAbilityProvider](../MockAbilityProvider/README.md)
