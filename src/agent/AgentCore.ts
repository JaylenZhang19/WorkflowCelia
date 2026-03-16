import { llmClient } from './LlmClient';
import { FileUtil } from '../utils';
import { logger } from '../utils';
import { AgentQueue } from './AgentQueue';
import { HeartbeatScheduler } from './HeartbeatScheduler';
import { SkillLoader } from './SkillLoader';
import { ToolsManager } from './ToolsManager';
import { AgentStepEvent, ChatResponse, Message, ToolCallRequest } from './types';
import { ProjectContext } from '../env/ProjectContext';
import { loadToolsConfig, ToolsConfig } from '../config/loadToolsConfig';

// 模拟 Python 的截断函数
function truncate(content: string, maxLength: number = 800): string {
  if (content.length <= maxLength) return content;
  const half = Math.floor(maxLength / 2);
  return `${content.substring(0, half)}\n... [已省略中间 ${content.length - maxLength} 字符] ...\n${content.substring(content.length - half)}`;
}

const TAG: string = 'AgentCore';

export class AgentCore {
  private conversationHistory: Message[] = [];
  private workspace: string;
  private skillLoader: SkillLoader;
  private toolsManager: ToolsManager;
  private initialized: boolean = false;
  private queue: AgentQueue = new AgentQueue();
  private heartbeat: HeartbeatScheduler;
  private resetHistoryOnFinish: boolean;
  private sessionLogPath: string | null = null;

  constructor(workspace: string) {
    this.workspace = workspace;
    const ctx = ProjectContext.getInstance();
    const toolsConfig: ToolsConfig = loadToolsConfig(ctx.paths.toolsConfigPath);
    this.resetHistoryOnFinish = ctx.config.agent.resetHistoryOnFinish ?? true;

    this.skillLoader = new SkillLoader(ctx.paths.skillsDir);
    this.toolsManager = new ToolsManager(
      this.workspace,
      ctx.paths.allowedDirs,
      toolsConfig.tools
    );
    this.heartbeat = new HeartbeatScheduler({
      workspace: this.workspace,
      intervalMinutes: ctx.config.agent.heartbeatInterval || 30,
      ensureInit: async () => this.init(),
      getSystemPrompt: () => this.getSystemPromptText(),
      getToolSchemas: () => this.toolsManager.getToolSchemas(),
      enqueue: (task) => { this.queue.enqueue(task); },
      onTask: (task) => {
        this.submitTask(task, (step) => {
          if (step.type === 'action' || step.type === 'final') {
            logger.info(TAG, `[AutoTask] ${step.title}: ${step.content}`);
          }
        });
      }
    });
    logger.info(TAG, `使用 ${ctx.config.model.modelName} 作为 API 模型`);
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    await this.skillLoader.loadAllSkills();
    logger.info(TAG, `可用技能: ${JSON.stringify(Array.from(this.skillLoader.skillMetadata.keys()))}`);
    await this.toolsManager.init();
    logger.info(TAG, `可用工具: ${JSON.stringify(this.toolsManager.listTools())}`);
    this.initSystemPrompt();
    this.initialized = true;
  }

  private initSystemPrompt(): void {
    const systemPrompt = this.buildSystemPrompt();
    this.conversationHistory = [
      { role: "system", content: systemPrompt }
    ];
  }

  public getSystemPromptText(): string {
    return this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    const skillMetadata = this.skillLoader.getMetadataSummary();
    return `你是一个深耕 HarmonyOS 生态的强大智能助手。你运行在应用的沙箱环境中，致力于通过调用应用能力和管理应用数据来协助用户。

【环境信息】
应用空间(Context): 所有操作仅限于当前应用的沙箱目录 ${this.workspace}。

- 技能目录: ${ProjectContext.getInstance().paths.skillsDir}

技能结构: 每个技能为一个独立目录，包含 SKILL.md 指引和可选的 referecens/

【技能】
在你回复用户请求时: 你需要先审视一遍<available_skills> <description>
- 如果下列中的任一一个skill和用户的请求相匹配时，你使用工具 read_file 去读取对应skill的 SKILL.md 文件，并根据它的指导完成用户的请求。
- 如果多个skill符合用户的请求: 选择最贴切的那个，读取并根据它的指引进行。
- 如果没有任何一个skill符合用户的请求: 不要读取任何一个skill的 SKILL.md 文件。
${skillMetadata}

【通用能力】
当没有匹配的技能时，可以直接完成通用任务，你拥有管理应用内数据的通用权限:

- 文件操作: 在沙箱内进行文件的读写、重命名、删除（符合 HarmonyOS 安全规范）。

- 目录管理：创建文件夹、列出文件

【工具使用规则】
1. 技能优先，匹配技能后，先使用 read_file 读取对应 SKILL.md 明确业务边界，再进行后续操作。
2. 无匹配技能和工具时：直接回复
3. 变量跨步骤保留
4. 无脚本原则， HarmonyOS 环境下严禁执行 Shell 命令或动态脚本。所有操作必须通过工具映射到 ArkTS 接口。
5. 工具调用失败时，分析错误后换方法重试
6. 主观判断由你直接思考完成，不写代码判断
7. 【HEARTBEAT 调度】如果用户要求配置定时任务或条件触发任务（例如定期检查邮件），你需要使用相关工具修改沙箱根目录（${ProjectContext.getInstance().paths.agentWorkDir}）下的 HEARTBEAT.md 文件。将触发条件和发生时需要执行的具体 prompt / task 写进 HEARTBEAT.md 文件中（最好具备一定的格式说明），这个文件中的任务后续会被调度器解析并自动执行。不要试图在当前对话内停留或写循环脚本。`;
  }

  public submitTask(userInput: string, onStep?: (step: AgentStepEvent) => void, maxSteps: number = 20): Promise<string> {
    logger.info(TAG, `📥 Task submitted: ${userInput}`);
    return this.queue.enqueue(() => this.executeSingleTask(userInput, onStep, maxSteps));
  }

  private async executeSingleTask(userInput: string, onStep?: (step: AgentStepEvent) => void, maxSteps: number = 20): Promise<string> {
    await this.init();
    logger.info(TAG, `====== STARTING TASK: ${userInput} ======`);

    const currentTime: string = new Date().toLocaleString();
    const initialHistoryLen: number = this.conversationHistory.length;

    // 创建工作副本
    let history: Message[] = [...this.conversationHistory];

    history.push({ role: "system", content: `当前时间: ${currentTime}, timestamp: ${new Date().getTime()}` });
    history.push({ role: "user", content: `Question: ${userInput}` });

    for (let step = 1; step <= maxSteps; step++) {
      logger.info(TAG, `🔄 Step ${step} (Thinking)...`);
      onStep?.({
        type: 'thought',
        title: `Step ${step}: 思考中`,
        content: "正在分析用户请求并规划步骤...",
        timestamp: Date.now()
      });
      const toolSchemas = this.toolsManager.getToolSchemas();
      const response: ChatResponse= await llmClient.chatCompletion(history, toolSchemas);
      logger.info(TAG, `LLM Response: ${JSON.stringify(response).slice(0, 500)}`)

      if (response.status === 'error') {
        logger.error(TAG, 'Stopping agent loop due to network error');
        onStep?.({
          type: 'final',
          title: '失败',
          content: response.content,
          timestamp: Date.now()
        });
        break;
      }
      if (response.content) {
        onStep?.({
          type: 'thought',
          title: `Step ${step}: 逻辑分析`,
          content: response.content,
          timestamp: Date.now()
        });
      }

      const toolCalls: ToolCallRequest[] = response.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const toolCallForHistory = [];
        for (const tc of toolCalls) {
          toolCallForHistory.push({
            "id": tc.id,
            "type": "function",
            "function": {
              "name": tc.name,
              "arguments": JSON.stringify(tc.arguments),
            }
          })
        }
        // 模型请求调用工具
        history.push({
          role: "assistant",
          content: response.content || "",
          tool_calls: toolCallForHistory
        });

        for (const tc of toolCalls) {
          const toolName: string = tc.name;
          const args: Record<string, any> = tc.arguments;

          logger.info(TAG, `  🔧 Tool: ${toolName}(${JSON.stringify(args)})`);
          onStep?.({
            type: 'action',
            title: `调用工具: ${toolName}`,
            content: `输入参数: ${JSON.stringify(args)}`,
            timestamp: Date.now()
          });

          // 执行工具
          const result: string = await this.toolsManager.executeTool(toolName, args);
          logger.info(TAG, `Tool result: \n ${result.slice(0, 500)}`)
          onStep?.({
            type: 'observation',
            title: `工具返回结果 (${toolName})`,
            content: result.length > 500 ? result.substring(0, 500) + "..." : result,
            timestamp: Date.now()
          });

          history.push({
            role: "tool",
            tool_call_id: tc.id,
            name: toolName,
            content: String(result)
          });

          if (toolName === "finish") {
            logger.info(TAG, `🤖 Agent: ${String(result)}`);
            const finalResult = String(tc.arguments['result'] || result);

            onStep?.({
              type: 'final',
              title: `任务完成`,
              content: finalResult,
              timestamp: Date.now()
            });

            if (!this.resetHistoryOnFinish) {
              // 更新长时记忆
              this.conversationHistory.push(...history.slice(initialHistoryLen));
            }
            await this.saveLogs(history);
            if (this.resetHistoryOnFinish) {
              this.initSystemPrompt();
            }
            return finalResult;
          }
        }
      } else {
        // 模型未调用工具
        const content = response.content || "";
        if (content) {
          logger.info(TAG, `Thiking: ${content.slice(0, 200)}`);
          history.push({ role: "assistant", content: content });
        } else {
          logger.warn(TAG, "LLM returned empty content");
        }
        history.push({
          role: "system",
          content: "请继续完成任务，或给出最终回复（当你已经完全完成用户的请求、给出了最终答案，或者确认无法继续执行时，必须调用 finish 工具结束）。"
        });
      }
    }
    if (!this.resetHistoryOnFinish) {
      this.conversationHistory.push(...history.slice(initialHistoryLen));
    }
    await this.saveLogs(history);
    if (this.resetHistoryOnFinish) {
      this.initSystemPrompt();
    }
    onStep?.({
      type: 'final',
      title: `任务超时`,
      content: '超过最大步数限制',
      timestamp: Date.now()
    });
    return "❌ 任务超时：超过最大步数限制。";
  }

  public startHeartbeat(): void {
    this.heartbeat.start();
  }

  public stopHeartbeat(): void {
    this.heartbeat.stop();
  }

  private formatTimestamp(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  private getLogPath(): string {
    if (!this.resetHistoryOnFinish) {
      if (!this.sessionLogPath) {
        const ts = this.formatTimestamp(new Date());
        this.sessionLogPath = `${this.workspace}/messages-${ts}.json`;
      }
      return this.sessionLogPath;
    }
    const ts = this.formatTimestamp(new Date());
    return `${this.workspace}/messages-${ts}.json`;
  }

  private async saveLogs(history: Message[]): Promise<void> {
    const logPath = this.getLogPath();
    try {
      FileUtil.writeTextFile(logPath, JSON.stringify(history, null, 2));
      logger.info(TAG, `saveLogs, 日志写入成功 logPath: ${logPath}`);
    } catch (e) {
      logger.error(TAG, `保存日志失败: ${JSON.stringify(e)}`);
    }
  }
}
