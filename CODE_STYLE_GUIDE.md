# AbilityLink SDK 代码规范

## 文件扩展名规范

根据 HarmonyOS 开发最佳实践，本项目采用以下代码规范：

| 代码类型 | 文件扩展名 | 说明 | 示例 |
|---------|-----------|------|------|
| **UI 代码** | `.ets` | ArkTS - 用于 ArkUI 界面组件 | `Index.ets`, `AbilityLinkDemo.ets` |
| **后端逻辑** | `.ts` | TypeScript - 用于业务逻辑、SDK 核心代码 | `types.ts`, `Consumer.ts`, `ProviderHelper.ts` |

## 目录结构

```
ability_link/
├── src/main/ets/
│   ├── types.ts               ← TypeScript (数据类型定义)
│   ├── ProviderHelper.ts      ← TypeScript (Provider 基类)
│   └── Consumer.ts            ← TypeScript (Consumer SDK 逻辑)
├── Index.ets                  ← ETS (模块入口，导出给 ArkUI 使用)
├── oh-package.json5
├── build-profile.json5
└── README.md
```

## 为什么这样区分？

### `.ets` (ArkTS)
- **用途**: UI 渲染、声明式界面
- **特性**: 支持 `@Component`, `@State`, `build()` 等 ArkUI 特性
- **示例**: 
  ```typescript
  @Component
  struct MyPage {
    @State message: string = 'Hello';
    
    build() {
      Column() {
        Text(this.message)
      }
    }
  }
  ```

### `.ts` (TypeScript)
- **用途**: 纯逻辑代码、数据处理、SDK 核心
- **特性**: 标准 TypeScript 语法，无 ArkUI 装饰器
- **优势**: 
  - 更好的代码复用性
  - 可用于非 UI 场景
  - 更符合传统开发习惯
  - 编译后体积更小

## 代码示例

### ✅ 正确示例

**types.ts** (TypeScript - 类型定义)
```typescript
export enum AbilityCategory {
  SYSTEM = 'system',
  COMMUNICATION = 'communication'
}

export interface AbilityLinkCapability {
  name: string;
  displayName: string;
  category: AbilityCategory;
}
```

**Consumer.ts** (TypeScript - 业务逻辑)
```typescript
export class AbilityLinkConsumer {
  private static instance: AbilityLinkConsumer;
  
  static getInstance(): AbilityLinkConsumer {
    if (!AbilityLinkConsumer.instance) {
      AbilityLinkConsumer.instance = new AbilityLinkConsumer();
    }
    return AbilityLinkConsumer.instance;
  }
  
  async discoverCapabilities(): Promise<DiscoveredCapability[]> {
    // 业务逻辑实现
  }
}
```

**Index.ets** (ETS - 模块入口)
```typescript
// 导出 TypeScript 模块供 ArkUI 使用
export {
  AbilityLinkCapability,
  AbilityCategory
} from './src/main/ets/types';

export { AbilityLinkConsumer } from './src/main/ets/Consumer';
```

**AbilityLinkDemo.ets** (ETS - UI 组件)
```typescript
@Entry
@Component
struct AbilityLinkDemo {
  @State capabilities: CapabilityInfo[] = [];
  
  build() {
    Column() {
      Text('AbilityLink Demo')
      List() {
        ForEach(this.capabilities, (cap) => {
          ListItem() {
            Text(cap.displayName)
          }
        })
      }
    }
  }
}
```

### ❌ 错误示例

**不应该在 .ts 文件中使用 ArkUI 装饰器：**
```typescript
// ❌ 错误 - types.ts 中不应该有 @Component
@Component  // 不应该出现在 .ts 文件中
export class MyService {
  @State  // 不应该出现在 .ts 文件中
  value: string = '';
}
```

**不应该在 .ets 文件中只写纯逻辑代码：**
```typescript
// ❌ 错误 - 纯逻辑代码应该放在 .ts 文件中
// 这个文件应该改为 Consumer.ts
export class AbilityLinkConsumer {
  // 纯逻辑代码
}
```

## 新建模块时的规范

### 1. 创建 SDK 模块（HAR）

```
my_sdk/
├── src/main/ets/
│   ├── utils.ts          ← 工具函数 (TypeScript)
│   ├── service.ts        ← 服务逻辑 (TypeScript)
│   └── types.ts          ← 类型定义 (TypeScript)
├── Index.ets             ← 入口 (ETS)
└── oh-package.json5
```

### 2. 创建 UI 页面

```
entry/src/main/ets/pages/
├── Index.ets             ← 主页面 (ETS)
├── DetailPage.ets        ← 详情页 (ETS)
└── Settings.ets          ← 设置页 (ETS)
```

### 3. 创建服务层

```
entry/src/main/ets/services/
├── DataService.ts        ← 数据服务 (TypeScript)
├── ApiService.ts         ← API 服务 (TypeScript)
└── AbilityService.ts     ← 能力服务 (TypeScript)
```

## 导入规范

### TypeScript 导入 TypeScript
```typescript
import { AbilityLinkCapability } from './types';
import { AbilityLinkConsumer } from './Consumer';
```

### ETS 导入 TypeScript
```typescript
// Index.ets 导入 TypeScript 模块
export { AbilityLinkConsumer } from './src/main/ets/Consumer';
```

### ETS 导入 ETS
```typescript
// AbilityLinkDemo.ets 导入服务
import { AbilityLinkService } from '../services/AbilityLinkService';
```

## 总结

| 场景 | 使用扩展名 | 位置 |
|------|-----------|------|
| ArkUI 组件、页面 | `.ets` | `pages/`, `components/` |
| 数据类型定义 | `.ts` | `src/main/ets/` |
| 业务逻辑、服务 | `.ts` | `services/`, `src/main/ets/` |
| 工具函数 | `.ts` | `utils/` |
| SDK 核心代码 | `.ts` | `src/main/ets/` |
| 模块入口（导出给 UI 用） | `.ets` | 模块根目录 |

**记忆口诀：** 
- **UI 用 ets，逻辑用 ts**
- **装饰器用 ets，纯代码用 ts**
- **页面组件用 ets，服务数据用 ts**
