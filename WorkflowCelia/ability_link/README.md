# AbilityLink SDK

AbilityLink 是一个用于 HarmonyOS 应用间能力注册与调用的 SDK 框架（HAR 包）。采用注册制 + IPC：

- Provider 应用启动时通过 IPC 向 WorkflowCelia 注册能力
- WorkflowCelia 维护能力注册表
- WorkflowCelia 通过 IPC 调用 Provider 的能力并获取结果

## 目录结构

```
ability_link/
├── src/main/ets/
│   ├── types.ts               # 核心类型定义 (TypeScript)
│   ├── ProviderHelper.ts      # Provider 辅助类 (TypeScript)
│   ├── Consumer.ts            # Consumer SDK (TypeScript)
│   └── Ipc.ts                 # IPC 协议与工具 (TypeScript)
├── Index.ets                  # SDK 入口文件 (ETS - 用于 ArkUI)
├── oh-package.json5           # 包配置
├── build-profile.json5        # 构建配置
├── hvigorfile.ts              # Hvigor 构建脚本
└── README.md                  # 本文档
```

**代码规范：**
- UI 相关代码使用 `.ets` (ArkTS)
- 后端逻辑代码使用 `.ts` (TypeScript)

## 构建 HAR 包

### 环境要求

- DevEco Studio 4.0+
- HarmonyOS SDK API 12+
- Node.js 16+

### 构建步骤

1. **打开 DevEco Studio**
   - 打开 WorkflowCelia 项目

2. **构建模块**
   - 在 DevEco Studio 中，右键点击 `ability_link` 模块
   - 选择 `Build` > `Make Module 'abilitylink'`
   - 或者使用命令行：

```bash
# 在 WorkflowCelia 项目根目录下执行
cd WorkflowCelia

# macOS
/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js \
  --mode module \
  -p product=default \
  -p module=ability_link@default \
  assembleHar

# Windows
hvigorw.bat --mode module -p product=default -p module=ability_link@default assembleHar

# Linux
./hvigorw --mode module -p product=default -p module=ability_link@default assembleHar
```

3. **生成的 HAR 包位置**
   ```
   WorkflowCelia/ability_link/build/default/outputs/default/ability_link.har
   ```

### 常见问题

#### DEVECO_SDK_HOME 错误

如果看到 `Invalid value of 'DEVECO_SDK_HOME'` 错误：

1. 在 DevEco Studio 中：`File` > `Settings` > `DevEco Studio` > `SDK`
2. 确认 SDK 路径正确
3. 设置环境变量：
   ```bash
   export DEVECO_SDK_HOME=/path/to/DevEco/Sdk
   export OHOS_SDK_HOME=/path/to/DevEco/Sdk
   ```

#### 构建失败

1. 停止守护进程：`node hvigorw.js --stop-daemon`
2. 清理构建缓存：`rm -rf build/`
3. 重新构建

## 使用方式

### Consumer 端（WorkflowCelia 使用能力）

1. **添加依赖**

在 `entry/oh-package.json5` 中：
```json5
{
  "dependencies": {
    "ability_link": "file:./ability_link"
  }
}
```

2. **初始化 SDK**

在 EntryAbility 或页面中：
```typescript
import { AbilityLinkConsumer } from 'ability_link';

const consumer = AbilityLinkConsumer.getInstance();
await consumer.initialize(this.context);
```

3. **获取能力**

```typescript
const capabilities = consumer.getAllCapabilities();
```

4. **调用能力**

```typescript
const result = await consumer.invoke(
  'com.example.provider',
  'sms.send',
  { phoneNumber: '12345678', message: 'Hello' }
);
```

### Provider 端（提供能力）

1. **添加依赖**

```json5
{
  "dependencies": {
    "ability_link": "file:../WorkflowCelia/ability_link"
  }
}
```

2. **继承 AbilityLinkProvider**

```typescript
import { AbilityLinkProvider, InvokeResult, AbilityLinkCapability } from 'ability_link';

class MyProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return MY_CAPABILITY;
  }

  async invoke(inputs: Record<string, any>): Promise<InvokeResult> {
    // 实现能力逻辑
    return { success: true, outputs: { result: 'ok' } };
  }
}
```

3. **在 ExtensionAbility 中使用（IPC Stub）**

```typescript
import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { rpc } from '@kit.IPCKit';
import { createProviderStub } from 'ability_link';

export default class MyServiceAbility extends AppServiceExtensionAbility {
  private provider: MyProvider;

  onCreate(): void {
    this.provider = new MyProvider();
  }

  onConnect(want: Want): rpc.RemoteObject {
    return createProviderStub(this.provider);
  }
}
```

4. **在 module.json5 中声明**

```json5
{
  "extensionAbilities": [
    {
      "name": "MyServiceAbility",
      "type": "appService",
      "exported": true,
      "metadata": [
        {
          "name": "ability-link.capability",
          "value": "{\"name\":\"my.action\",\"displayName\":\"我的能力\",...}"
        }
      ]
    }
  ]
}
```

5. **应用启动时注册能力**

```typescript
import { AbilityLinkRegistrar } from 'ability_link';

const registrar = new AbilityLinkRegistrar(this.context);
await registrar.register({
  bundleName: 'com.example.provider',
  bundleDisplayName: 'Example Provider',
  capabilities: [MY_CAPABILITY]
});
```

## API 参考

### 核心类

#### AbilityLinkConsumer

能力消费者 SDK，用于注册表维护和调用能力。

**主要方法：**
- `initialize(context)` - 初始化 SDK
- `getAllCapabilities()` - 获取已注册能力
- `invoke(bundle, capability, inputs)` - 调用能力
- `getCapability(bundle, capability)` - 获取能力信息
- `registerCapabilities(registration)` - 注册能力（内部由 WorkflowCelia 接收）
- `dispose()` - 释放资源

#### AbilityLinkProvider

能力提供者基类，Provider 应用需要继承此类。

**主要方法：**
- `getCapability()` - 获取能力元数据（抽象方法）
- `invoke(inputs)` - 处理调用请求（抽象方法）
- `isAvailable()` - 检查能力可用性
- `validateInputs(inputs)` - 验证输入参数
- `dispose()` - 释放资源

### 类型定义

#### AbilityLinkCapability

能力元数据接口：
```typescript
interface AbilityLinkCapability {
  name: string;           // 能力名称
  displayName: string;    // 显示名称
  description: string;    // 描述
  version: string;        // 版本号
  category: AbilityCategory;  // 类别
  inputs: CapabilityParameter[];   // 输入参数
  outputs: CapabilityParameter[];  // 输出参数
  permissions: string[];  // 所需权限
  requiresConfirmation: boolean;  // 是否需要确认
  serviceAbilityName?: string;     // Provider ServiceAbility 名称
}
```

#### AbilityCategory

能力类别枚举：
- `SYSTEM` - 系统能力
- `COMMUNICATION` - 通信能力
- `MEDIA` - 媒体能力
- `LOCATION` - 位置能力
- `CALENDAR` - 日历能力
- `CONTACTS` - 联系人能力
- `HEALTH` - 健康能力
- `SMART_HOME` - 智能家居
- `PRODUCTIVITY` - 生产力工具
- `FINANCE` - 金融服务
- `SHOPPING` - 购物应用
- `ENTERTAINMENT` - 娱乐应用
- `CUSTOM` - 自定义能力

#### CapabilityDataType

数据类型枚举：
- `STRING` - 字符串
- `NUMBER` - 数字
- `BOOLEAN` - 布尔值
- `OBJECT` - 对象
- `ARRAY` - 数组
- `DATE` - 日期
- `FILE` - 文件
- `IMAGE` - 图片
- `CONTACT` - 联系人
- `LOCATION` - 位置

#### InvokeResult

调用结果接口：
```typescript
interface InvokeResult {
  success: boolean;       // 是否成功
  outputs?: Record<string, any>;  // 输出数据
  error?: string;         // 错误信息
  errorCode?: string;     // 错误码
  metadata?: Record<string, any>; // 元数据
}
```

## 许可证

Apache-2.0
