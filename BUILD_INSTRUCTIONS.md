# AbilityLink SDK 构建说明

## 项目结构

```
WorkflowCelia/
├── ability_link/              # AbilityLink SDK (HAR 包)
│   ├── src/main/ets/
│   │   ├── types.ts           # 核心类型定义 (TypeScript)
│   │   ├── ProviderHelper.ts  # Provider 辅助类 (TypeScript)
│   │   └── Consumer.ts        # Consumer SDK (TypeScript)
│   ├── Index.ets              # SDK 入口文件 (ETS)
│   ├── oh-package.json5       # 包配置
│   ├── build-profile.json5    # 构建配置
│   ├── hvigorfile.ts          # Hvigor 构建脚本
│   └── README.md              # SDK 文档
│
├── entry/                     # WorkflowCelia 主应用
│   └── oh-package.json5       # 引用 ability_link HAR
│
└── MockAbilityProvider/       # 模拟能力提供者应用
    └── entry/
        └── oh-package.json5   # 引用 ability_link HAR
```

**代码规范：**
- UI 相关代码使用 `.ets` (ArkTS)
- 后端逻辑代码使用 `.ts` (TypeScript)

## 构建步骤

### 前置条件

1. **安装 DevEco Studio 4.0+**
   - 下载地址：https://developer.harmonyos.com/cn/develop/deveco-studio

2. **配置 HarmonyOS SDK**
   - 打开 DevEco Studio
   - File > Settings > DevEco Studio > SDK
   - 确认 SDK 路径正确（通常为 `~/Library/Huawei/Sdk`）

3. **设置环境变量**（可选）
   ```bash
   export DEVECO_SDK_HOME=~/Library/Huawei/Sdk
   export OHOS_SDK_HOME=~/Library/Huawei/Sdk
   ```

### 构建 HAR 包

#### 方法一：使用 DevEco Studio（推荐）

1. **打开项目**
   - 启动 DevEco Studio
   - Open > 选择 `WorkflowCelia` 文件夹

2. **构建 ability_link 模块**
   - 在项目面板中，展开 `WorkflowCelia` > `ability_link`
   - 右键点击 `ability_link` 模块
   - 选择 `Build` > `Build HAR`

3. **查看输出**
   - 构建成功后，HAR 包位于：
     ```
     WorkflowCelia/ability_link/build/default/outputs/default/ability_link.har
     ```

#### 方法二：使用命令行

```bash
# 进入 WorkflowCelia 项目目录
cd /Users/jinglun/repository/DevEcoStudioProjects/WorkflowCelia/WorkflowCelia

# 停止守护进程（如果有）
node /Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js --stop-daemon

# 构建 HAR 包
node /Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js \
  --mode module \
  -p product=default \
  -p module=ability_link@default \
  assembleHar
```

### 验证构建

构建成功后，你应该看到：

```
> hvigor BUILD SUCCESS in xxxx ms
```

HAR 包内容验证：

```bash
cd WorkflowCelia/ability_link/build/default/outputs/default
unzip -l ability_link.har
```

应该包含：
- `types.ts` - 类型定义
- `ProviderHelper.ts` - Provider 辅助代码
- `Consumer.ts` - Consumer 代码
- `Index.ets` - 入口文件

## 使用构建的 HAR 包

### 在 WorkflowCelia 中使用

HAR 包构建后，WorkflowCelia 的 entry 模块会自动引用：

```json5
// WorkflowCelia/entry/oh-package.json5
{
  "dependencies": {
    "ability_link": "file:./ability_link"
  }
}
```

### 在 MockAbilityProvider 中使用

MockAbilityProvider 通过相对路径引用：

```json5
// MockAbilityProvider/entry/oh-package.json5
{
  "dependencies": {
    "ability_link": "file:../WorkflowCelia/ability_link"
  }
}
```

### 在其他项目中使用

1. **复制 HAR 包**
   ```bash
   cp WorkflowCelia/ability_link/build/default/outputs/default/ability_link.har \
      /path/to/your-project/libs/
   ```

2. **添加依赖**
   ```json5
   {
     "dependencies": {
       "ability_link": "file:./libs/ability_link"
     }
   }
   ```

3. **导入使用**
   ```typescript
   import { AbilityLinkConsumer } from 'ability_link';
   ```

## 常见问题

### 1. DEVECO_SDK_HOME 错误

**错误信息：**
```
Invalid value of 'DEVECO_SDK_HOME' in the system environment path.
```

**解决方案：**
1. 在 DevEco Studio 中确认 SDK 路径正确
2. 设置环境变量：
   ```bash
   export DEVECO_SDK_HOME=~/Library/Huawei/Sdk
   ```
3. 停止守护进程后重试：
   ```bash
   node hvigorw.js --stop-daemon
   ```

### 2. 模块找不到

**错误信息：**
```
Module ability_link not found
```

**解决方案：**
1. 确认 HAR 包已构建
2. 检查 oh-package.json5 中的路径是否正确
3. 运行 `ohpm install` 重新安装依赖

### 3. 导入错误

**错误信息：**
```
Module 'ability_link' has no exported member 'AbilityLinkConsumer'
```

**解决方案：**
1. 检查 Index.ets 是否正确导出
2. 确认导入语句：`import { AbilityLinkConsumer } from 'ability_link'`
3. 重新构建 HAR 包

### 4. 构建失败

**解决方案：**
1. 清理构建缓存：
   ```bash
   rm -rf build/
   rm -rf .hvigor/
   ```
2. 停止守护进程：
   ```bash
   node hvigorw.js --stop-daemon
   ```
3. 重新构建

## 发布 HAR 包

### 本地发布

1. 构建 HAR 包
2. 将 HAR 包复制到项目的 libs 目录
3. 在 oh-package.json5 中引用本地路径

### 发布到 ohpm（未来）

1. 完善 oh-package.json5 信息
2. 注册 ohpm 账号
3. 执行 `ohpm publish`

## 版本管理

### 更新 HAR 包版本

1. 修改 `ability_link/oh-package.json5` 中的 version
2. 重新构建 HAR 包
3. 更新引用项目的依赖版本

### 兼容性

- HarmonyOS SDK API 12+
- DevEco Studio 4.0+
- Node.js 16+

## 开发调试

### 调试 Consumer 代码

在 WorkflowCelia 中添加日志：

```typescript
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x3001;
const TAG = 'AbilityLink.Consumer';

hilog.info(DOMAIN, TAG, 'Discovery started...');
```

查看日志：

```bash
hdc shell hilog | grep "AbilityLink"
```

### 调试 Provider 代码

在 MockAbilityProvider 中添加日志：

```typescript
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x1000;
const TAG = 'SmsServiceExtension';

hilog.info(DOMAIN, TAG, 'SMS invoked with: %{public}s', phoneNumber);
```

## 下一步

1. ✅ 构建 ability_link HAR 包
2. ⏳ 构建 WorkflowCelia 应用
3. ⏳ 构建 MockAbilityProvider 应用
4. ⏳ 安装到设备测试
5. ⏳ 验证能力发现与调用

## 相关文档

- [AbilityLink SDK README](./ability_link/README.md)
- [WorkflowCelia README](./WorkflowCelia/README.md)
- [MockAbilityProvider README](./MockAbilityProvider/README.md)
- [集成指南](./INTEGRATION_GUIDE.md)
