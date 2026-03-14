import fs from '@ohos.file.fs';
import { llmClient } from '../LlmClient';
import { SkillLoader } from './SkillLoader';
import { ToolsManager } from './ToolsManager';
import { AgentStepEvent, ChatResponse, Message } from './types';

// 模拟 Python 的截断函数
function truncate(content: string, maxLength: number = 800): string {
  if (content.length <= maxLength) return content;
  const half = Math.floor(maxLength / 2);
  return `${content.substring(0, half)}\n... [已省略中间 ${content.length - maxLength} 字符] ...\n${content.substring(content.length - half)}`;
}

export class AgentCore {
  private conversationHistory: Message[] = [];
  private skillsDir: string;
  private apiModel: string;
  private workspace: string;
  private skillLoader: SkillLoader;
  private toolsManager: ToolsManager;

  constructor(workspace: string, apiModel: string = "qwen-2.5-72B") {
    this.apiModel = apiModel;
    this.workspace = workspace;
    this.skillsDir = workspace + '/skills'

    this.skillLoader = new SkillLoader(this.skillsDir);
    this.toolsManager = new ToolsManager(this.workspace);

    this.initSystemPrompt();
    console.info(`使用 ${apiModel} 作为 API 模型`);
  }

  private initSystemPrompt(): void {
    const systemPrompt = this.buildSystemPrompt();
    this.conversationHistory = [
      { role: "system", content: systemPrompt }
    ];
  }

  private buildSystemPrompt(): string {
    const skillMetadata = this.skillLoader.getMetadataSummary();
    return `你是一个强大的 HarmonyOS 智能助手。
【环境信息】
- 工作目录：${this.workspace}
- 技能目录：${this.skillsDir}
... (省略其余鸿蒙版提示词内容) ...
★ 重要：任务完成必须调用 finish 工具。`;
  }

  public async run(userInput: string, onStep?: (step: AgentStepEvent) => void, maxSteps: number = 20): Promise<string> {
    console.info(`NEW TASK: ${userInput}`);

    const currentTime = new Date().toLocaleString();
    const initialHistoryLen = this.conversationHistory.length;

    // 创建工作副本
    let history: Message[] = [...this.conversationHistory];
    history.push({ role: "user", content: `Current Time: ${currentTime}` });
    history.push({ role: "user", content: `Question: ${userInput}` });

    for (let step = 1; step <= maxSteps; step++) {
      console.info(`🔄 Step ${step} (Thinking)...`);
      onStep?.({
        type: 'thought',
        title: `Step ${step}: 思考中`,
        content: "正在分析用户请求并规划步骤...",
        timestamp: Date.now()
      });
      const toolSchemas = this.toolsManager.getToolSchemas();
      const response: ChatResponse= await llmClient.chatCompletion(history, toolSchemas);

      if (response.content) {
        onStep?.({
          type: 'thought',
          title: `Step ${step}: 逻辑分析`,
          content: response.content,
          timestamp: Date.now()
        });
      }

      const toolCalls = response.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // 模型请求调用工具
        history.push({
          role: "assistant",
          content: response.content || "",
          tool_calls: toolCalls
        });

        for (const tc of toolCalls) {
          console.info(`  🔧 Tool: ${tc.name}(${JSON.stringify(tc.arguments)})`);
          onStep?.({
            type: 'action',
            title: `调用工具: ${tc.name}`,
            content: `输入参数: ${JSON.stringify(tc.arguments)}`,
            timestamp: Date.now()
          });

          // 执行工具
          const result = await this.toolsManager.executeTool(tc.name, tc.arguments);

          onStep?.({
            type: 'observation',
            title: `工具返回结果 (${tc.name})`,
            content: result.length > 500 ? result.substring(0, 500) + "..." : result,
            timestamp: Date.now()
          });

          history.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.name,
            content: String(result)
          });

          if (tc.name === "finish") {
            const finalResult = String(result);
            console.info(`🤖 Agent: ${finalResult}`);

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
          history.push({ role: "assistant", content: content });
        }
        history.push({
          role: "user",
          content: "System：请继续完成任务，或给出最终回复（必须调用 finish 工具结束）。"
        });
      }
    }

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
      fs.closeSync(file);
    } catch (e) {
      console.error("保存日志失败");
    }
  }
}