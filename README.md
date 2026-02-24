# Workflow for HarmonyOS

鸿蒙工作流自动化引擎 - 用于执行预定义的工作流任务

## 项目结构

```
entry/src/main/ets/
├── core/                      # 核心引擎 (TypeScript)
│   ├── models/                # 数据模型
│   │   ├── DataType.ts        # 数据类型定义
│   │   ├── Action.ts          # 动作定义
│   │   ├── Workflow.ts        # 工作流定义
│   │   └── WorkflowContext.ts # 执行上下文
│   ├── engine/                # 核心引擎
│   │   ├── ActionRegistry.ts    # 动作注册中心
│   │   ├── ContentGraphEngine.ts # 类型转换引擎
│   │   └── WorkflowEngine.ts     # 工作流执行引擎
│   └── actions/               # 内置动作
│       ├── ScriptingActions.ts  # 脚本动作
│       ├── SystemActions.ts     # 系统动作
│       ├── PhotosActions.ts     # 照片动作
│       ├── CalendarActions.ts   # 日历动作
│       └── BuiltInActions.ts    # 初始化
│
├── providers/                 # 能力提供者 (模拟系统/第三方 API)
│   ├── system/                # 系统能力
│   │   ├── LocationProvider.ts    # 位置
│   │   ├── BatteryProvider.ts     # 电池
│   │   └── DeviceInfoProvider.ts  # 设备信息
│   ├── photos/                # 照片能力
│   │   └── PhotosProvider.ts      # 照片库
│   ├── calendar/              # 日历能力
│   │   └── CalendarProvider.ts    # 日历
│   └── notification/          # 通知能力
│       └── NotificationProvider.ts # 通知
│
└── pages/                     # UI 界面 (ArkTS)
    ├── Index.ets
    └── WorkflowsList.ets
```

## 架构设计

### 分层架构

| 层级 | 目录 | 职责 |
|------|------|------|
| UI 层 | `pages/` | 用户界面，工作流列表和编辑 |
| 引擎层 | `core/engine/` | 工作流执行、动作注册、类型转换 |
| 动作层 | `core/actions/` | 动作定义和实现 |
| 提供者层 | `providers/` | 封装系统/第三方 API |

### 数据流

```
UI (WorkflowsList.ets)
    ↓
引擎层 (WorkflowEngine)
    ↓
动作层 (SystemActions, etc.)
    ↓
提供者层 (LocationProvider, etc.)
    ↓
系统 API (待接入真实 API)
```

## 核心模块

### 引擎层

| 模块 | 功能 |
|------|------|
| `ActionRegistry` | 动作注册、查找、分类 |
| `ContentGraphEngine` | 自动类型转换（如 number → text） |
| `WorkflowEngine` | 顺序执行动作、超时控制、错误处理 |

### 提供者层（Providers）

| 提供者 | 能力 | 状态 |
|--------|------|------|
| `LocationProvider` | 获取位置、地址解析 | ✅ 模拟 |
| `BatteryProvider` | 电池状态 | ✅ 模拟 |
| `DeviceInfoProvider` | 设备信息、网络状态 | ✅ 模拟 |
| `PhotosProvider` | 照片库访问 | ✅ 模拟 |
| `CalendarProvider` | 日历事件 | ✅ 模拟 |
| `NotificationProvider` | 显示通知 | ✅ 模拟 |

> **TODO**: 将 providers 中的模拟数据替换为真实的 HarmonyOS 系统 API

### 内置动作

| 类别 | 动作 |
|------|------|
| **Scripting** | `set_variable`, `get_variable`, `log`, `wait` |
| **System** | `get_current_date`, `get_battery_level`, `get_current_location`, `show_notification` |
| **Photos** | `get_latest_photos`, `get_photos_from_album`, `save_to_album` |
| **Calendar** | `get_calendar_events`, `get_today_events` |

## 使用示例

### 执行工作流

```typescript
import { 
  createWorkflow, 
  createActionNode, 
  WorkflowEngine,
  initializeBuiltInActions 
} from './core/index';

// 初始化
initializeBuiltInActions();

// 创建工作流
const workflow = createWorkflow('My Workflow');
workflow.actions = [
  createActionNode('get_current_date', '获取日期'),
  createActionNode('get_battery_level', '获取电量')
];

// 执行
const engine = WorkflowEngine.getInstance();
const result = await engine.execute(workflow, {}, true);

console.log(result.success ? '成功' : '失败');
console.log('日志:', result.logs);
```

### 使用 Provider

```typescript
import { LocationProvider } from './providers/system/LocationProvider';

const provider = LocationProvider.getInstance();
const location = await provider.getCurrentLocation(true);
console.log(`位置：${location.latitude}, ${location.longitude}`);
```

### 创建自定义 Provider

```typescript
// providers/weather/WeatherProvider.ts
export interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
}

export class WeatherProvider {
  private static instance: WeatherProvider;
  
  static getInstance(): WeatherProvider {
    if (!WeatherProvider.instance) {
      WeatherProvider.instance = new WeatherProvider();
    }
    return WeatherProvider.instance;
  }
  
  async getCurrentWeather(): Promise<Weather> {
    // TODO: 调用真实天气 API
    return {
      temperature: 25,
      condition: 'Sunny',
      humidity: 60
    };
  }
}
```

### 创建自定义动作

```typescript
import { 
  ActionExecutor, 
  ActionResult, 
  ActionDefinition,
  IWorkflowContext 
} from './core/models/Action';
import { DataType } from './core/models/DataType';
import { WeatherProvider } from '../providers/weather/WeatherProvider';

class GetWeatherAction implements ActionExecutor {
  getDefinition(): ActionDefinition {
    return {
      id: 'get_weather',
      name: 'Get Weather',
      description: 'Get current weather',
      category: 'weather',
      inputs: [],
      outputs: [{ name: 'weather', type: DataType.OBJECT, required: true }],
      version: '1.0.0'
    };
  }

  async execute(inputs: any, context: IWorkflowContext): Promise<ActionResult> {
    const provider = WeatherProvider.getInstance();
    const weather = await provider.getCurrentWeather();
    return { success: true, outputs: { weather } };
  }
}
```

## 接入真实系统 API

在 providers 中替换模拟数据为真实 HarmonyOS API：

### 示例：位置 Provider

```typescript
// providers/system/LocationProvider.ts
import geolocation from '@ohos.geolocation';

export class LocationProvider {
  async getCurrentLocation(highAccuracy: boolean = false): Promise<Location> {
    // 使用真实 HarmonyOS 位置 API
    const location = await geolocation.getCurrentLocation({
      accuracy: highAccuracy ? 'accuracy_high' : 'accuracy_low'
    });
    
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.time
    };
  }
}
```

### 示例：电池 Provider

```typescript
// providers/system/BatteryProvider.ts
import power from '@ohos.power';

export class BatteryProvider {
  async getBatteryStatus(): Promise<BatteryStatus> {
    const batteryInfo = await power.getBatteryInfo();
    
    return {
      level: batteryInfo.percentage,
      charging: batteryInfo.isCharging
    };
  }
}
```

## 构建和运行

使用 DevEco Studio 打开项目并运行到设备或模拟器。

## License

MIT
