import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { Tool } from './tools/BaseTool';
import { logger } from '../utils';
import { ToolConfigItem } from '../config/loadToolsConfig';

/**
 * 智能助手工具管理器
 */
export class ToolsManager {
  private workspace: string | null = null;
  private allowedDir: string | null = null;
  private tools: Map<string, Tool> = new Map();
  private toolConfig: ToolConfigItem[] = [];
  private projectRoot: string | null = null;
  private initialized: boolean = false;

  /**
   * 初始化工具管理器
   * @param workspace 基础工作目录 (通常为 context.filesDir)
   * @param allowedDir 允许操作的目录限制
   * @param toolConfig 工具配置文件
   * @param projectRoot 项目根目录
   */
  constructor(
    workspace: string | null = null,
    allowedDir: string | null = null,
    toolConfig: ToolConfigItem[] = [],
    projectRoot: string | null = null
  ) {
    this.workspace = workspace;
    this.allowedDir = allowedDir;
    this.toolConfig = toolConfig;
    this.projectRoot = projectRoot;
  }

  private resolveModuleFile(modulePath: string, absPath: string): string {
    const projectRoot = this.projectRoot ? path.resolve(this.projectRoot) : process.cwd();
    const base = absPath;
    const candidates: string[] = [];

    const pushIf = (p: string) => {
      if (!candidates.includes(p)) candidates.push(p);
    };

    pushIf(base);
    pushIf(`${base}.js`);
    pushIf(`${base}.ts`);

    if (modulePath.startsWith('src/')) {
      const distBase = path.resolve(projectRoot, 'dist', modulePath);
      pushIf(distBase);
      pushIf(`${distBase}.js`);
    } else if (base.startsWith(path.resolve(projectRoot, 'src') + path.sep)) {
      const relFromSrc = path.relative(path.resolve(projectRoot, 'src'), base);
      const distBase = path.resolve(projectRoot, 'dist', 'src', relFromSrc);
      pushIf(distBase);
      pushIf(`${distBase}.js`);
    }

    const found = candidates.find((p) => fs.existsSync(p));
    return found ?? base;
  }

  private ensureSafeModulePath(modulePath: string): string {
    const projectRoot = this.projectRoot ? path.resolve(this.projectRoot) : process.cwd();
    const abs = path.isAbsolute(modulePath) ? modulePath : path.resolve(projectRoot, modulePath);
    const toolsDir = path.resolve(projectRoot, 'src/agent/tools');
    if (!abs.startsWith(toolsDir)) {
      throw new Error(`Tool module path must be under ${toolsDir}: ${modulePath}`);
    }
    return abs;
  }

  /**
   * 从 tools.json 动态加载并注册工具
   */
  public async init(): Promise<void> {
    if (this.initialized) return;

    for (const item of this.toolConfig) {
      if (!item.enabled) continue;
      try {
        const safeAbs = this.ensureSafeModulePath(item.module);
        const resolved = this.resolveModuleFile(item.module, safeAbs);
        const mod = await import(pathToFileURL(resolved).href);
        const ToolCtor = mod[item.export];
        if (!ToolCtor) {
          logger.warn('ToolsManager', `Export '${item.export}' not found in ${item.module}`);
          continue;
        }
        const tool: Tool = new ToolCtor(this.workspace, this.allowedDir);
        if (tool.name !== item.name) {
          logger.warn(
            'ToolsManager',
            `Tool name mismatch for ${item.module}:${item.export} (config: ${item.name}, actual: ${tool.name})`
          );
        }
        this.registerTool(tool);
      } catch (e) {
        logger.warn(
          'ToolsManager',
          `Failed to load tool ${item.name} from ${item.module}:${item.export} - ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    this.initialized = true;
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
