# 新应用集成指南

本指南说明如何将新的第三方应用集成到 AbilityLink 生态系统中，使 WorkflowCelia 能够发现并调用该应用的能力。

## 集成流程概述

```
1. 添加 SDK 依赖 → 2. 定义能力 → 3. 实现 Provider → 4. 配置 module.json5 → 5. 测试
```

## 步骤 1: 添加 SDK 依赖

### 使用 WorkflowCelia 的 ability_link HAR 模块

在您的应用的 `entry/oh-package.json5` 中添加：

```json5
{
  "name": "entry",
  "version": "1.0.0",
  "dependencies": {
    "ability_link": "file:../WorkflowCelia/ability_link"
  }
}
```

**注意：** 需要先构建 `WorkflowCelia/ability_link` 模块生成 HAR 包。

### 构建 HAR 包

在 WorkflowCelia 项目目录下执行：

```bash
cd /path/to/WorkflowCelia

# macOS
/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js \
  --mode module -p product=default -p module=ability_link@default assembleHar

# 或在 DevEco Studio 中右键 ability_link 模块 > Build > Build HAR
```

HAR 包生成位置：
```
WorkflowCelia/ability_link/build/default/outputs/default/ability_link.har
```

## 步骤 2: 定义能力

创建能力定义文件，描述您的应用提供的能力：

```typescript
// 例如：entry/src/main/ets/capabilities/CalendarCapability.ts
import {
  AbilityLinkCapability,
  AbilityCategory,
  CapabilityDataType
} from '@ability-link/sdk';

export const CREATE_EVENT_CAPABILITY: AbilityLinkCapability = {
  name: 'calendar.create_event',
  displayName: '创建日历事件',
  description: '在日历中创建新事件',
  version: '1.0.0',
  category: AbilityCategory.CALENDAR,
  icon: '$media:calendar_icon',
  inputs: [
    {
      name: 'title',
      type: CapabilityDataType.STRING,
      required: true,
      description: '事件标题'
    },
    {
      name: 'startTime',
      type: CapabilityDataType.DATE,
      required: true,
      description: '开始时间'
    },
    {
      name: 'endTime',
      type: CapabilityDataType.DATE,
      required: true,
      description: '结束时间'
    },
    {
      name: 'location',
      type: CapabilityDataType.STRING,
      required: false,
      description: '事件地点'
    },
    {
      name: 'description',
      type: CapabilityDataType.STRING,
      required: false,
      description: '事件描述'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: CapabilityDataType.BOOLEAN,
      required: true,
      description: '是否创建成功'
    },
    {
      name: 'eventId',
      type: CapabilityDataType.STRING,
      required: false,
      description: '事件 ID'
    }
  ],
  permissions: ['ohos.permission.WRITE_CALENDAR'],
  requiresConfirmation: true,
  metadata: {
    // 自定义元数据
    supportsRecurring: true,
    supportsReminders: true
  }
};
```

## 步骤 3: 实现 Provider

创建能力提供者实现类：

```typescript
// 例如：entry/src/main/ets/providers/CalendarAbilityProvider.ts
import {
  AbilityLinkProvider,
  InvokeResult
} from '@ability-link/sdk';
import { CREATE_EVENT_CAPABILITY } from '../capabilities/CalendarCapability';
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x4000;
const TAG = 'CalendarAbilityProvider';

export class CalendarAbilityProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return CREATE_EVENT_CAPABILITY;
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

    try {
      // 实现创建日历事件的逻辑
      const { title, startTime, endTime, location, description } = inputs;

      // 这里调用实际的日历 API
      // const eventId = await this.createCalendarEvent({...});

      // 模拟实现
      const eventId = `EVENT_${Date.now()}`;

      hilog.info(DOMAIN, TAG, 'Created calendar event: %{public}s', title);

      return {
        success: true,
        outputs: {
          success: true,
          eventId: eventId
        },
        metadata: {
          provider: 'CalendarApp',
          capability: 'calendar.create_event',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'Failed to create event: %{public}s', JSON.stringify(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建事件失败',
        errorCode: 'EVENT_CREATE_FAILED'
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    // 检查日历权限等
    return true;
  }
}
```

## 步骤 4: 创建 ExtensionAbility

创建用于暴露能力的 ExtensionAbility：

```typescript
// 例如：entry/src/main/ets/calendarability/CalendarAbility.ts
import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { CalendarAbilityProvider } from '../providers/CalendarAbilityProvider';

const DOMAIN = 0x4000;
const TAG = 'CalendarAbility';

export default class CalendarAbility extends AppServiceExtensionAbility {
  private provider: CalendarAbilityProvider;

  onCreate(): void {
    hilog.info(DOMAIN, TAG, 'CalendarAbility onCreate');
    this.provider = new CalendarAbilityProvider();
  }

  onDestroy(): void {
    hilog.info(DOMAIN, TAG, 'CalendarAbility onDestroy');
    this.provider.dispose();
  }

  async onStartCommand(want: Want, startId: number): Promise<void> {
    hilog.info(DOMAIN, TAG, 'onStartCommand: %{public}s', JSON.stringify(want));

    try {
      const result = await this.provider.invoke(want.parameters);
      hilog.info(DOMAIN, TAG, 'Result: %{public}s', JSON.stringify(result));
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Error: %{public}s', JSON.stringify(err));
    }
  }
}
```

## 步骤 5: 配置 module.json5

在 `module.json5` 中声明 ExtensionAbility 和能力元数据：

```json5
{
  "module": {
    "name": "entry",
    "type": "entry",
    "deviceTypes": ["phone"],
    "abilities": [
      {
        "name": "EntryAbility",
        "srcEntry": "./ets/entryability/EntryAbility.ets",
        "exported": true
      }
    ],
    "extensionAbilities": [
      {
        "name": "CalendarAbility",
        "srcEntry": "./ets/calendarability/CalendarAbility.ts",
        "type": "appService",
        "exported": true,
        "permissions": ["ohos.permission.WRITE_CALENDAR"],
        "skills": [
          {
            "actions": ["action.calendar.create_event"]
          }
        ],
        "metadata": [
          {
            "name": "ability-link.capability",
            "value": "{\"name\":\"calendar.create_event\",\"displayName\":\"创建日历事件\",\"description\":\"在日历中创建新事件\",\"version\":\"1.0.0\",\"category\":\"calendar\",\"inputs\":[{\"name\":\"title\",\"type\":\"string\",\"required\":true,\"description\":\"事件标题\"},{\"name\":\"startTime\",\"type\":\"date\",\"required\":true,\"description\":\"开始时间\"},{\"name\":\"endTime\",\"type\":\"date\",\"required\":true,\"description\":\"结束时间\"},{\"name\":\"location\",\"type\":\"string\",\"required\":false,\"description\":\"事件地点\"},{\"name\":\"description\",\"type\":\"string\",\"required\":false,\"description\":\"事件描述\"}],\"outputs\":[{\"name\":\"success\",\"type\":\"boolean\",\"required\":true,\"description\":\"是否创建成功\"},{\"name\":\"eventId\",\"type\":\"string\",\"required\":false,\"description\":\"事件 ID\"}],\"permissions\":[\"ohos.permission.WRITE_CALENDAR\"],\"requiresConfirmation\":true}"
          }
        ]
      }
    ]
  }
}
```

## 步骤 6: 测试

### 单元测试 Provider

```typescript
// 例如：entry/src/test/CalendarAbilityProvider.test.ts
import { CalendarAbilityProvider } from '../main/ets/providers/CalendarAbilityProvider';

describe('CalendarAbilityProvider', () => {
  let provider: CalendarAbilityProvider;

  beforeEach(() => {
    provider = new CalendarAbilityProvider();
  });

  afterEach(() => {
    provider.dispose();
  });

  test('should create event successfully', async () => {
    const result = await provider.invoke({
      title: 'Test Meeting',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });

    expect(result.success).toBe(true);
    expect(result.outputs?.eventId).toBeDefined();
  });

  test('should fail with missing parameters', async () => {
    const result = await provider.invoke({});

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_PARAMETERS');
  });
});
```

### 集成测试

1. 安装 MockAbilityProvider 和您的应用到设备/模拟器
2. 打开 WorkflowCelia 应用
3. 进入 AbilityLink Demo 页面
4. 点击 "Discover Capabilities"
5. 验证您的能力出现在列表中
6. 选择您的能力并测试调用

## 多能力应用

如果您的应用提供多个能力，使用 `MultiCapabilityProvider`：

```typescript
import {
  MultiCapabilityProvider,
  AbilityLinkCapability,
  InvokeResult
} from '@ability-link/sdk';

export class MultiCalendarProvider extends MultiCapabilityProvider {
  getCapabilities(): AbilityLinkCapability[] {
    return [
      CREATE_EVENT_CAPABILITY,
      DELETE_EVENT_CAPABILITY,
      UPDATE_EVENT_CAPABILITY
    ];
  }

  async invoke(capabilityName: string, inputs: Record<string, any>): Promise<InvokeResult> {
    switch (capabilityName) {
      case 'calendar.create_event':
        return this.createEvent(inputs);
      case 'calendar.delete_event':
        return this.deleteEvent(inputs);
      case 'calendar.update_event':
        return this.updateEvent(inputs);
      default:
        return {
          success: false,
          error: `Unknown capability: ${capabilityName}`,
          errorCode: 'CAPABILITY_NOT_FOUND'
        };
    }
  }

  private async createEvent(inputs: Record<string, any>): Promise<InvokeResult> {
    // 实现创建逻辑
  }

  private async deleteEvent(inputs: Record<string, any>): Promise<InvokeResult> {
    // 实现删除逻辑
  }

  private async updateEvent(inputs: Record<string, any>): Promise<InvokeResult> {
    // 实现更新逻辑
  }
}
```

在 `module.json5` 中为每个能力添加单独的 metadata 条目。

## 最佳实践

### 1. 能力设计
- **单一职责**: 每个能力只做一件事
- **明确命名**: 使用 `domain.action` 格式
- **完整描述**: 提供清晰的描述和使用说明
- **合理分类**: 选择正确的能力类别

### 2. 输入输出
- **最小化必填参数**: 只要求必要的参数
- **提供默认值**: 对于可选参数提供合理的默认值
- **类型安全**: 使用正确的数据类型
- **验证规则**: 添加适当的验证规则

### 3. 错误处理
- **明确错误码**: 定义清晰的错误码体系
- **友好错误信息**: 提供用户友好的错误信息
- **本地化**: 支持多语言错误信息

### 4. 性能
- **快速响应**: 能力调用应快速返回
- **异步处理**: 对于耗时操作使用异步处理
- **资源管理**: 及时释放资源

### 5. 安全
- **权限检查**: 在执行前检查权限
- **用户确认**: 敏感操作要求用户确认
- **数据验证**: 验证所有输入数据

## 常见问题

### Q: 能力命名冲突怎么办？
A: 使用您的应用包名作为前缀，如 `com.example.calendar.create_event`

### Q: 如何处理需要用户交互的能力？
A: 设置 `requiresConfirmation: true`，Consumer 会在调用前请求用户确认

### Q: 能力可以依赖其他能力吗？
A: 不建议。每个能力应该是独立的。如需组合，应在 Consumer 端实现

### Q: 如何更新已发布的能力？
A: 增加 `version` 字段，保持向后兼容。重大变更应创建新能力

## 示例代码

完整示例参考：
- `MockAbilityProvider/entry/src/main/ets/smsserviceability/` - 短信能力示例
- `MockAbilityProvider/entry/src/main/ets/emailserviceability/` - 邮件能力示例

## 技术支持

如有问题，请查阅：
- AbilityLink SDK README.md
- WorkflowCelia 项目文档
- HarmonyOS 官方文档
