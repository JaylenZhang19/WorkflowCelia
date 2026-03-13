import fs from '@ohos.file.fs';

// 模拟 Python 的截断函数
function truncate(content: string, maxLength: number = 800): string {
  if (content.length <= maxLength) return content;
  const half = Math.floor(maxLength / 2);
  return `${content.substring(0, half)}\n... [已省略中间 ${content.length - maxLength} 字符] ...\n${content.substring(content.length - half)}`;
}

interface Message {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class LocalAgent {
  private conversationHistory: Message[] = [];
  private skillsDir: string;
  private apiModel: string;
  private workspace: string;
  private skillLoader: any; // 需对接您的 SkillLoader TS 版
  private toolsManager: any; // 需对接您的 ToolsManager TS 版

  constructor(
    skillsDir: string = "rawfile/skills",
    apiModel: string = "qwen-2.5-72B",
    context: any // 鸿蒙的 Context 用于获取沙箱路径
  ) {
    this.skillsDir = skillsDir;
    this.apiModel = apiModel;
    this.workspace = context.filesDir; // 鸿蒙沙箱起始目录

    // 初始化组件 (此处假设您已有对应的 TS 类)
    // this.skillLoader = new SkillLoader(skillsDir);
    // this.toolsManager = new ToolsManager(this.workspace);

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
    // 这里的逻辑与您之前要求的鸿蒙版 Prompt 一致
    const skillMetadata = ""; // 从 skillLoader 获取
    return `你是一个强大的 HarmonyOS 智能助手。
【环境信息】
- 工作目录：${this.workspace}
- 技能目录：${this.skillsDir}
... (省略其余鸿蒙版提示词内容) ...
★ 重要：任务完成必须调用 finish 工具。`;
  }

  public async run(userInput: string, maxSteps: number = 20): Promise<string> {
    console.info(`NEW TASK: ${userInput}`);

    const currentTime = new Date().toLocaleString();
    const initialHistoryLen = this.conversationHistory.length;

    // 创建工作副本
    let history: Message[] = [...this.conversationHistory];
    history.push({ role: "user", content: `Current Time: ${currentTime}` });
    history.push({ role: "user", content: `Question: ${userInput}` });

    for (let step = 1; step <= maxSteps; step++) {
      console.info(`🔄 Step ${step} (Thinking)...`);

      // 调用 LLM (此处需对接您的鸿蒙版网络请求)
      // const toolSchemas = this.toolsManager.getToolSchemas();
      // const response = await chatWithLlmWithTools(history, this.apiModel, toolSchemas);
      const response: any = {}; // 模拟响应

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

          // 执行工具
          const result = await this.toolsManager.executeTool(tc.name, tc.arguments);

          history.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.name,
            content: String(result)
          });

          if (tc.name === "finish") {
            const finalResult = String(result);
            console.info(`🤖 Agent: ${finalResult}`);

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