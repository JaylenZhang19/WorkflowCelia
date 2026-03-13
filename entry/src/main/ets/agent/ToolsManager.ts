import { Tool } from './tools/BaseTool'; // 假设您已有基础 Tool 类
import { ReadFileTool, WriteFileTool, EditFileTool, ListDirTool } from './tools/FileTool';
import { FinishTool } from './tools/FinishTool';

/**
 * 智能助手工具管理器 - HarmonyOS 版
 */
export class ToolsManager {
  private workspace: string | null = null;
  private allowedDir: string | null = null;
  private execTimeout: number;
  private restrictToWorkspace: boolean;
  private tools: Map<string, Tool> = new Map();

  /**
   * 初始化工具管理器
   * @param workspace 基础工作目录 (通常为 context.filesDir)
   * @param allowedDir 允许操作的目录限制
   * @param execTimeout 任务超时时间 (秒)
   * @param restrictToWorkspace 是否限制在工作空间内
   */
  constructor(
    workspace: string | null = null,
    allowedDir: string | null = null,
    execTimeout: number = 60,
    restrictToWorkspace: boolean = false
  ) {
    this.workspace = workspace;
    this.allowedDir = allowedDir;
    this.execTimeout = execTimeout;
    this.restrictToWorkspace = restrictToWorkspace;

    this.registerDefaultTools();
  }

  /**
   * 注册默认内置工具
   * 注意：鸿蒙环境下移除了 ExecTool (Shell)，建议替换为原生的原子能力工具
   */
  private registerDefaultTools(): void {
    // 文件系统工具
    this.registerTool(new ReadFileTool(this.workspace, this.allowedDir));
    this.registerTool(new WriteFileTool(this.workspace, this.allowedDir));
    this.registerTool(new EditFileTool(this.workspace, this.allowedDir));
    this.registerTool(new ListDirTool(this.workspace, this.allowedDir));

    // 任务完成工具
    this.registerTool(new FinishTool());

    // 提示：此处可以根据需要注册鸿蒙特有能力，如 AppJumpTool, DeviceInfoTool 等
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