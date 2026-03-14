import { Tool } from './tools/BaseTool';
import { logger } from '../utils';
import { ToolConfigItem } from '../config/loadToolsConfig';
import { TOOL_REGISTRY } from './tools/registry';

/**
 * 智能助手工具管理器
 */
export class ToolsManager {
  private workspace: string | null = null;
  private allowedDir: string | null = null;
  private tools: Map<string, Tool> = new Map();
  private toolConfig: ToolConfigItem[] | null = null;

  /**
   * 初始化工具管理器
   * @param workspace 基础工作目录 (通常为 context.filesDir)
   * @param allowedDir 允许操作的目录限制
   * @param toolConfig 工具配置文件
   */
  constructor(
    workspace: string | null = null,
    allowedDir: string | null = null,
    toolConfig: ToolConfigItem[]
  ) {
    this.workspace = workspace;
    this.allowedDir = allowedDir;
    this.toolConfig = toolConfig;

    this.registerAllTools();
  }

  /**
   * 注册默认内置工具
   * 注意：鸿蒙环境下移除了 ExecTool (Shell)，建议替换为原生的原子能力工具
   */
  private registerAllTools(): void {
    const registry = TOOL_REGISTRY;
    const ctx = { workspace: this.workspace, allowedDir: this.allowedDir };

    if (!this.toolConfig) {
      Object.keys(registry).forEach((name) => {
        this.registerTool(registry[name](ctx));
      });
      return;
    }

    const configuredNames = new Set<string>();
    for (const item of this.toolConfig) {
      configuredNames.add(item.name);
      if (!item.enabled) continue;
      const factory = registry[item.name];
      if (!factory) {
        logger.warn('ToolsManager', `Unknown tool in tools.json: ${item.name}`);
        continue;
      }
      this.registerTool(factory(ctx));
    }

    const missing = Object.keys(registry).filter((name) => !configuredNames.has(name));
    if (missing.length > 0) {
      logger.warn('ToolsManager', `Tools not listed in tools.json: ${missing.join(', ')}`);
    }
  }

  /**
   * 注册一个新工具
   */
  public registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * 注销工具
   */
  public unregisterTool(toolName: string): void {
    this.tools.delete(toolName);
  }

  /**
   * 获取工具实例
   */
  public getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * 列出所有已注册工具名称
   */
  public listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取符合 OpenAI 格式的函数描述 (JSON Schema)
   */
  public getToolSchemas(): Record<string, any>[] {
    const schemas: Record<string, any>[] = [];
    this.tools.forEach((tool) => {
      schemas.push(tool.toSchema());
    });
    return schemas;
  }

  /**
   * 执行工具逻辑
   * 由于鸿蒙环境 IO 较多为异步，此处使用 async/await
   */
  public async executeTool(toolName: string, args: Record<string, any>): Promise<string> {
    const tool = this.getTool(toolName);
    if (!tool) {
      return `Error: Tool '${toolName}' not found`;
    }

    // 参数校验
    const errors = tool.validateParams(args);
    if (errors && errors.length > 0) {
      return `Error: Invalid parameters: ${errors.join(', ')}`;
    }

    // 执行任务
    try {
      // 假设 Tool.execute 是异步方法
      return await tool.execute(args);
    } catch (e) {
      return `Error executing tool '${toolName}': ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  /**
   * 获取所有可用工具的人类可读描述
   */
  public getToolsDescription(): string {
    const descriptions: string[] = [];
    this.tools.forEach((tool) => {
      descriptions.push(`- ${tool.name}: ${tool.description}`);
    });
    return descriptions.join('\n');
  }
}
