import fs from '@ohos.file.fs';
import { ProjectContext } from '../env';
import { llmClient } from '../LlmClient';
import { logger } from '../utils/Logger';
import { SkillLoader } from './SkillLoader';
import { ToolsManager } from './ToolsManager';
import { AgentStepEvent, ChatResponse, Message, ToolCallRequest } from './types';

// 模拟 Python 的截断函数
function truncate(content: string, maxLength: number = 800): string {
  if (content.length <= maxLength) return content;
  const half = Math.floor(maxLength / 2);
  return `${content.substring(0, half)}\n... [已省略中间 ${content.length - maxLength} 字符] ...\n${content.substring(content.length - half)}`;
}

const TAG: string = 'AgentCore';

export class AgentCore {
  private conversationHistory: Message[] = [];
  private skillsDir: string;
  private workspace: string;
  private skillLoader: SkillLoader;
  private toolsManager: ToolsManager;

  constructor(workspace: string) {
    this.workspace = workspace;
    this.skillsDir = workspace + '/skills'

    this.skillLoader = new SkillLoader(this.skillsDir);
    this.toolsManager = new ToolsManager(this.workspace);
    logger.info(TAG, `可用工具: ${JSON.stringify(this.toolsManager.listTools())}`);
    logger.info(TAG, `可用技能: ${JSON.stringify(Array.from(this.skillLoader.skillMetadata.keys()))}`)

    logger.info(TAG, `使用 ${ProjectContext.getInstance().config.model.modelName} 作为 API 模型`);
    this.initSystemPrompt();
  }

  private initSystemPrompt(): void {
    const systemPrompt = this.buildSystemPrompt();
    this.conversationHistory = [
      { role: "system", content: systemPrompt }
    ];
  }

  private buildSystemPrompt(): string {
    const skillMetadata = this.skillLoader.getMetadataSummary();
    return `你是一个深耕 HarmonyOS 生态的强大智能助手。你运行在应用的沙箱环境中，致力于通过调用应用能力和管理应用数据来协助用户。

【环境信息】
应用空间(Context): 所有操作仅限于当前应用的沙箱目录 ${this.workspace}。

- 技能目录: ${this.skillsDir}

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
6. 主观判断由你直接思考完成，不写代码判断`;
  }

  public async run(
    userInput: string,
    onStep?: (step: AgentStepEvent) => void,
    maxSteps: number = 20
  ): Promise<string> {
    logger.info(TAG, `====== NEW TASK: ${userInput} ======`);

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

            // 更新长时记忆
            this.conversationHistory.push(...history.slice(initialHistoryLen));
            this.saveLogs(history);
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
    this.saveLogs(history);
    this.conversationHistory.push(...history.slice(initialHistoryLen));
    onStep?.({
      type: 'final',
      title: `任务超时`,
      content: '超过最大步数限制',
      timestamp: Date.now()
    });
    return "❌ 任务超时：超过最大步数限制。";
  }

  private saveLogs(history: Message[]): void {
    // 鸿蒙文件写入示例
    const logPath = `${this.workspace}/messages.json`;
    try {
      let file = fs.openSync(logPath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
      fs.writeSync(file.fd, JSON.stringify(history, null, 2));
      logger.info(TAG, `saveLogs, 日志写入成功 logPath: ${logPath}`)
      fs.closeSync(file);
    } catch (e) {
      logger.error(TAG, "保存日志失败");
    }
  }
}