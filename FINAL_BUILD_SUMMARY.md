# AbilityLink SDK - 最终构建总结

## ✅ 构建成功

两个项目都已成功编译：

### WorkflowCelia (Consumer)
```
> hvigor BUILD SUCCESSFUL in 143 ms
```
输出：`WorkflowCelia/entry/build/default/outputs/default/entry-default-signed.hap`

### MockAbilityProvider (Provider)
```
> hvigor BUILD SUCCESSFUL in 347 ms
```
输出：`MockAbilityProvider/entry/build/default/outputs/default/entry-default-signed.hap`

### ability_link SDK (HAR)
```
> hvigor BUILD SUCCESSFUL in 333 ms
```
输出：`WorkflowCelia/ability_link/build/default/outputs/default/ability_link.har`

## 架构设计

### 注册制架构

```
┌─────────────────────┐         ┌─────────────────────┐
│   Provider App      │         │   WorkflowCelia     │
│   (MockAbility)     │         │   (Consumer)        │
│                     │         │                     │
│  1. 启动时注册能力   │────────>│  2. 维护注册表      │
│                     │         │                     │
│  4. 执行能力         │<────────│  3. 调用能力        │
└─────────────────────┘         └─────────────────────┘
```

**为什么采用注册制？**
- HarmonyOS 不允许应用获取其他已安装应用的信息
- Provider 应用启动时主动向 WorkflowCelia 注册能力
- WorkflowCelia 维护已注册能力列表

## 项目结构

### ability_link SDK
```
WorkflowCelia/ability_link/
├── src/main/ets/
│   ├── types.ts               ← TypeScript: 类型定义
│   ├── ProviderHelper.ts      ← TypeScript: Provider 基类
│   └── Consumer.ts            ← TypeScript: Consumer SDK
├── Index.ets                  ← ETS: 模块入口
└── oh-package.json5
```

### WorkflowCelia
```
WorkflowCelia/entry/src/main/ets/
├── services/
│   └── AbilityLinkService.ets ← 服务封装 (ETS)
├── pages/
│   └── AbilityLinkDemo.ets    ← 演示页面
└── entryability/
    └── EntryAbility.ets
```

### MockAbilityProvider
```
MockAbilityProvider/entry/src/main/ets/
├── smsserviceability/
│   └── SmsServiceAbility.ets  ← 短信能力 (ETS)
├── emailserviceability/
│   └── EmailServiceAbility.ets ← 邮件能力 (ETS)
└── entryability/
    └── EntryAbility.ets
```

## 代码规范

### 文件扩展名规则
- **UI 代码** → `.ets` (ArkTS) - 用于 ArkUI 组件、页面、Service
- **后端逻辑** → `.ts` (TypeScript) - 仅用于 HAR 包中的纯逻辑代码

### 类型规则
- 禁止使用 `any`，使用 `Object` 或具体类型
- 对象字面量必须对应显式声明的类或接口
- 使用类型断言时需要明确类型

## 使用方式

### Provider 注册能力

Provider 应用（如 MockAbilityProvider）在启动时不需要自动注册，而是通过 WorkflowCelia 的演示页面手动注册（用于测试）：

```typescript
// WorkflowCelia 的 AbilityLinkDemo.ets 中
const registration: RegistrationInfo = {
  bundleName: 'com.pumpkin.mockabilityprovider',
  bundleDisplayName: 'MockAbility Provider',
  capabilities: [
    {
      name: 'sms.send',
      displayName: '发送短信',
      category: AbilityCategory.COMMUNICATION,
      // ... 其他定义
    }
  ]
};

abilityLinkService.registerCapabilities(registration);
```

### Consumer 调用能力

```typescript
// WorkflowCelia 中调用短信能力
const result = await abilityLinkService.invokeCapability(
  'com.pumpkin.mockabilityprovider',
  'sms.send',
  {
    phoneNumber: '12345678',
    message: 'Hello from WorkflowCelia'
  }
);

if (result.success) {
  console.log('SMS sent successfully');
}
```

## 核心 API

### AbilityLinkConsumer

```typescript
// 初始化
await consumer.initialize(context);

// 注册能力
consumer.registerCapabilities(registration);

// 注销能力
consumer.unregisterCapabilities(bundleName);

// 获取所有能力
const capabilities = consumer.getAllCapabilities();

// 调用能力
const result = await consumer.invoke(bundleName, capabilityName, inputs);
```

### AbilityLinkProvider

```typescript
class MyProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return MY_CAPABILITY;
  }

  async invoke(inputs: Record<string, Object>): Promise<InvokeResult> {
    // 实现能力逻辑
    return { success: true, outputs: { ... } };
  }
}
```

## 事件系统

```typescript
consumer.on(AbilityLinkEvent.CAPABILITY_REGISTERED, (data) => {
  console.log('新能力注册:', data.bundleName, data.capabilityName);
});

consumer.on(AbilityLinkEvent.INVOCATION_COMPLETE, (data) => {
  console.log('调用完成:', data.success);
});
```

## 下一步开发建议

### 1. 实现自动注册机制

目前需要手动注册能力，建议实现以下方案之一：

**方案 A: 广播注册**
```typescript
// Provider 启动时发送广播
const want: Want = {
  action: 'ability-link.action.REGISTER',
  parameters: capabilities
};
await context.startAbility(want);
```

**方案 B: RPC 连接**
```typescript
// Provider 通过 RPC 连接到 WorkflowCelia
const remote = await rpc.connect(remoteObject);
remote.registerCapabilities(capabilities);
```

**方案 C: 共享数据库**
```typescript
// Provider 写入数据库
const db = getRdbStore();
db.insert('capabilities', capabilityData);

// WorkflowCelia 读取数据库
const capabilities = db.query('SELECT * FROM capabilities');
```

### 2. 完善能力调用响应

目前调用是单向的（fire-and-forget），建议实现双向通信：
- Provider 执行完成后返回结果
- Consumer 接收执行结果

### 3. 添加身份验证

- Provider 注册时验证身份
- 调用时验证权限

### 4. 持久化注册信息

- 将注册信息保存到本地数据库
- 应用重启后恢复注册状态

## 测试流程

1. **安装应用**
   - 安装 WorkflowCelia.hap
   - 安装 MockAbilityProvider.hap

2. **注册能力**
   - 打开 WorkflowCelia
   - 进入 AbilityLink Demo 页面
   - 点击 "Register Mock Provider"

3. **调用能力**
   - 选择注册的能力
   - 填写参数
   - 点击 "Send SMS" 或 "Send Email"

4. **查看日志**
   ```bash
   hdc shell hilog | grep "AbilityLink"
   ```

## 常见问题

### Q: 为什么 HAR 包使用 .ts 而应用使用 .ets？
A: HAR 包中的纯逻辑代码可以使用 TypeScript，但应用层代码（包括 Service）必须使用 ArkTS (.ets) 以支持 ArkUI 特性。

### Q: 为什么采用注册制而不是发现制？
A: HarmonyOS 出于安全考虑，不允许应用获取其他已安装应用的信息。注册制符合平台安全模型。

### Q: 如何添加新的能力 Provider？
A: 
1. 创建新的 ExtensionAbility
2. 继承 AbilityLinkProvider
3. 实现 getCapability() 和 invoke() 方法
4. 在 module.json5 中声明
5. 在应用启动时注册能力

## 相关文档

- [SDK README](./WorkflowCelia/ability_link/README.md)
- [架构变更说明](./ARCHITECTURE_CHANGE.md)
- [构建说明](./BUILD_INSTRUCTIONS.md)
- [代码规范](./CODE_STYLE_GUIDE.md)
