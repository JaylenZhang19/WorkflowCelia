# AbilityLink SDK 架构说明

## 架构变更

### 旧架构（发现制）- ❌ 不可行

最初设计采用**自动发现**架构：
- Consumer 应用通过 `bundleManager` 扫描已安装应用
- 读取每个应用的 `module.json5` 元数据
- 自动发现并注册能力

**问题：** HarmonyOS 出于安全考虑，**不允许应用获取其他已安装应用的信息**。`bundleManager` 没有提供获取所有已安装应用的 API。

### 新架构（注册制 + IPC）- ✅ 可行

现在采用**主动注册 + IPC 调用**架构：
- Provider 应用启动时，通过 IPC 向 WorkflowCelia 注册能力
- WorkflowCelia 维护已注册能力列表
- WorkflowCelia 通过 IPC 调用 Provider 能力并获取结果

```
┌─────────────────────┐         ┌─────────────────────┐
│   Provider App      │         │   WorkflowCelia     │
│   (MockAbility)     │         │   (Consumer)        │
│                     │         │                     │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │ AbilityLink   │  │         │  │ AbilityLink   │  │
│  │ Provider IPC  │  │         │  │ Registry IPC  │  │
│  └───────┬───────┘  │         │  └───────┬───────┘  │
│          │          │         │          │          │
│          │ 1. 注册能力  │         │          │          │
│          │──────────>│         │          │          │
│          │          │         │          │          │
│          │ 2. 调用能力  │         │          │          │
│          │<──────────│         │          │          │
│          │          │         │          │          │
│          │ 3. 心跳保持  │         │          │          │
│          │──────────>│         │          │          │
└──────────┴──────────┘         └──────────┴──────────┘
```

## 工作流程

### 1. Provider 注册流程

```typescript
// Provider 应用（如 MockAbilityProvider）启动时
import { AbilityLinkRegistrar } from 'ability_link';

// 准备注册信息
const registration: RegistrationInfo = {
  bundleName: 'com.pumpkin.mockabilityprovider',
  bundleDisplayName: 'MockAbility Provider',
  capabilities: [
    {
      name: 'sms.send',
      displayName: '发送短信',
      category: AbilityCategory.COMMUNICATION,
      // ... 其他能力定义
    }
  ]
};

// 注册能力
const registrar = new AbilityLinkRegistrar(this.context);
await registrar.register(registration);
```

### 2. Consumer 调用流程

```typescript
// WorkflowCelia 中调用能力
const consumer = AbilityLinkConsumer.getInstance();

// 获取已注册的能力列表
const capabilities = consumer.getAllCapabilities();

// 调用短信能力
const result = await consumer.invoke(
  'com.pumpkin.mockabilityprovider',
  'sms.send',
  {
    phoneNumber: '12345678',
    message: 'Hello'
  }
);
```

### 3. 心跳保持（可选）

Provider 应用定期发送心跳，保持能力可用状态：

```typescript
// Provider 应用定期调用
setInterval(() => {
  // 更新心跳时间
  updateHeartbeat();
}, 10000);
```

## 实现方式

### 方案 1：使用 Want 广播注册

Provider 应用发送广播，WorkflowCelia 接收并注册：

```typescript
// Provider 发送广播
const want: Want = {
  action: 'ability-link.action.REGISTER',
  parameters: {
    bundleName: 'com.example.provider',
    capabilities: [...]
  }
};
await context.startAbility(want);
```

### 方案 2：使用 RPC 远程过程调用（已采用）

Provider 应用通过 RPC 连接到 WorkflowCelia：

```typescript
// Provider 发起 RPC 连接
const remote = await rpc.connect(remoteObject);
remote.registerCapabilities(capabilities);
```

### 方案 3：使用共享数据库

使用关系型数据库作为中介：

```typescript
// Provider 写入数据库
const db = getRdbStore();
db.insert('capabilities', capabilityData);

// WorkflowCelia 读取数据库
const capabilities = db.query('SELECT * FROM capabilities');
```

## SDK API 变更

### 移除的 API

```typescript
// ❌ 移除 - 不再支持自动发现
discoverCapabilities(filter?: DiscoveryFilter): Promise<DiscoveredCapability[]>
```

### 新增的 API

```typescript
// ✅ 新增 - 注册能力
registerCapabilities(registration: RegistrationInfo): void

// ✅ 新增 - 注销能力
unregisterCapabilities(bundleName: string): void

// ✅ 新增 - 获取已注册能力
getAllCapabilities(): RegisteredCapability[]

// ✅ 新增 - 获取自注册信息
getSelfRegistrationInfo(): RegistrationInfo | null
```

### 类型变更

```typescript
// ❌ 移除
interface DiscoveredCapability {
  discoveredAt: number;
  // ...
}

// ✅ 新增
interface RegisteredCapability {
  registeredAt: number;
  lastHeartbeat?: number;
  // ...
}

// ✅ 新增
interface RegistrationInfo {
  bundleName: string;
  bundleDisplayName: string;
  capabilities: AbilityLinkCapability[];
}
```

## 集成指南

### Provider 应用集成步骤

1. **添加依赖**
```json5
{
  "dependencies": {
    "ability_link": "file:../WorkflowCelia/ability_link"
  }
}
```

2. **在应用启动时注册**
```typescript
// EntryAbility.ts
import { AbilityLinkConsumer, RegistrationInfo } from 'ability_link';

async onCreate() {
  // 注册能力
  const consumer = AbilityLinkConsumer.getInstance();
  
  const registration: RegistrationInfo = {
    bundleName: this.context.abilityInfo.bundleName,
    bundleDisplayName: 'My App',
    capabilities: [SMS_CAPABILITY, EMAIL_CAPABILITY]
  };
  
  consumer.registerCapabilities(registration);
}
```

3. **在应用退出时注销**
```typescript
async onDestroy() {
  const consumer = AbilityLinkConsumer.getInstance();
  consumer.unregisterCapabilities(this.context.abilityInfo.bundleName);
}
```

### Consumer 应用（WorkflowCelia）

WorkflowCelia 作为中心节点，维护所有已注册的能力：

```typescript
// AbilityLinkService.ts
export class AbilityLinkService {
  private consumer: AbilityLinkConsumer;
  
  async initialize(context: common.UIAbilityContext) {
    this.consumer = AbilityLinkConsumer.getInstance();
    await this.consumer.initialize(context);
    
    // 监听注册事件
    this.consumer.on(AbilityLinkEvent.CAPABILITY_REGISTERED, (cap) => {
      console.log('新能力注册:', cap);
    });
  }
  
  // 提供给 UI 调用的方法
  async invokeCapability(bundle: string, capability: string, inputs: any) {
    return this.consumer.invoke(bundle, capability, inputs);
  }
}
```

## 优势

1. **符合 HarmonyOS 安全模型** - 不需要获取其他应用信息
2. **实时更新** - Provider 可以随时注册/注销
3. **支持心跳检测** - 可以检测 Provider 是否在线
4. **更灵活** - 支持多种注册方式（广播、RPC、数据库等）

## 注意事项

1. **Provider 必须先启动** - Provider 应用需要先注册能力，WorkflowCelia 才能调用
2. **生命周期管理** - Provider 需要在退出时注销能力
3. **权限控制** - WorkflowCelia 可以验证 Provider 的身份
4. **数据持久化** - 可以将注册信息保存到数据库，重启后恢复

## 下一步

1. 实现注册广播机制
2. 实现心跳检测
3. 添加 Provider 身份验证
4. 支持能力调用回调
