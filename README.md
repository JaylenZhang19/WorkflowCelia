# Workflow for HarmonyOS

鸿蒙工作流自动化引擎 - 用于执行预定义的工作流任务

## 项目结构

```
WorkflowCelia/
├── core/                    # TypeScript 核心引擎
│   ├── src/
│   │   ├── models/          # 数据模型
│   │   │   ├── DataType.ts  # 数据类型
│   │   │   ├── Action.ts    # 动作定义
│   │   │   ├── Workflow.ts  # 工作流定义
│   │   │   └── WorkflowContext.ts # 执行上下文
│   │   ├── engine/          # 核心引擎
│   │   │   ├── ActionRegistry.ts    # 动作注册中心
│   │   │   ├── ContentGraphEngine.ts # 类型转换引擎
│   │   │   └── WorkflowEngine.ts     # 工作流执行引擎
│   │   ├── actions/         # 内置动作
│   │   │   ├── ScriptingActions.ts
│   │   │   ├── SystemActions.ts
│   │   │   ├── PhotosActions.ts
│   │   │   └── BuiltInActions.ts
│   │   └── index.ts         # 导出入口
│   ├── package.json
│   └── tsconfig.json
└── entry/                   # HarmonyOS 应用
    └── src/main/ets/
        └── pages/           # UI 页面
            ├── Index.ets
            └── WorkflowsList.ets
```

## 核心模块

### 数据类型 (DataType.ts)
- `text`, `number`, `boolean` - 基础类型
- `image`, `video` - 媒体类型
- `location` - 位置类型
- `object`, `array`, `any` - 复杂类型

### 工作流引擎 (WorkflowEngine.ts)
- 顺序执行动作
- 自动类型转换
- 超时控制
- 错误处理

### 类型转换引擎 (ContentGraphEngine.ts)
- 自动类型转换
- 图路径查找

### 内置动作
| 类别 | 动作 |
|------|------|
| Scripting | `set_variable`, `get_variable`, `log`, `wait` |
| System | `get_current_date`, `get_battery_level`, `get_current_location`, `show_notification` |
| Photos | `get_latest_photos`, `save_to_album` |

## 使用示例

### 创建工作流并执行

```typescript
import { 
  createWorkflow, 
  createActionNode, 
  WorkflowEngine,
  initializeBuiltInActions 
} from '@core/index';

// 初始化
initializeBuiltInActions();

// 创建工作流
const workflow = createWorkflow('My Workflow');
workflow.actions = [
  createActionNode('get_current_date', '获取日期'),
  createActionNode('log', '记录日志')
];
workflow.actions[1].inputValues = { 
  message: '执行完成', 
  level: 'info' 
};

// 执行工作流
const engine = WorkflowEngine.getInstance();
const result = await engine.execute(workflow, {}, true);

if (result.success) {
  console.log('成功:', result.outputs);
  console.log('日志:', result.logs);
} else {
  console.error('失败:', result.error);
}
```

### 创建自定义动作

```typescript
import { 
  ActionExecutor, 
  ActionResult, 
  ActionDefinition,
  IWorkflowContext 
} from '@core/index';

class MyAction implements ActionExecutor {
  getDefinition(): ActionDefinition {
    return {
      id: 'my_action',
      name: '我的动作',
      description: '自定义动作',
      category: 'custom',
      inputs: [],
      outputs: [{ name: 'result', type: 'text' }],
      version: '1.0.0'
    };
  }

  async execute(inputs: any, context: IWorkflowContext): Promise<ActionResult> {
    return { 
      success: true, 
      outputs: { result: 'Hello' } 
    };
  }
}

// 注册动作
import { ActionRegistry } from '@core/index';
const registry = ActionRegistry.getInstance();
registry.register(new MyAction().getDefinition(), new MyAction());
```

## 构建和运行

### 1. 构建核心库

```bash
cd core
npm install
npm run build
```

### 2. 运行应用

使用 DevEco Studio 打开项目并运行。

## API 参考

### WorkflowEngine

```typescript
// 获取实例
const engine = WorkflowEngine.getInstance();

// 执行工作流
const result = await engine.execute(
  workflow: Workflow,
  inputs?: Record<string, any>,
  debugMode?: boolean
): Promise<WorkflowExecutionResult>

// 取消执行
engine.cancelWorkflow(workflowId: string): boolean
```

### WorkflowExecutionResult

```typescript
interface WorkflowExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
  executionTime: number;      // 毫秒
  logs: ExecutionLog[];
  nodeResults: Map<string, NodeResult>;
}
```

### ExecutionLog

```typescript
interface ExecutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}
```

## 技术栈

- **后端**: TypeScript (.ts)
- **前端**: ArkTS (.ets)
- **目标平台**: HarmonyOS

## License

MIT
