import path from 'path';
import { FileUtil, logger } from '../utils';
import { llmClient } from './LlmClient';
import { Message, ChatResponse } from './types';

const TAG = 'HeartbeatScheduler';

export interface HeartbeatSchedulerOptions {
  workspace: string;
  intervalMinutes: number;
  ensureInit: () => Promise<void>;
  getSystemPrompt: () => string;
  getToolSchemas: () => Record<string, any>[];
  enqueue: (task: () => Promise<void>) => void;
  onTask: (task: string) => void;
}

export class HeartbeatScheduler {
  private workspace: string;
  private intervalMinutes: number;
  private ensureInit: () => Promise<void>;
  private getSystemPrompt: () => string;
  private getToolSchemas: () => Record<string, any>[];
  private enqueue: (task: () => Promise<void>) => void;
  private onTask: (task: string) => void;
  private intervalId?: NodeJS.Timeout;

  constructor(options: HeartbeatSchedulerOptions) {
    this.workspace = options.workspace;
    this.intervalMinutes = options.intervalMinutes;
    this.ensureInit = options.ensureInit;
    this.getSystemPrompt = options.getSystemPrompt;
    this.getToolSchemas = options.getToolSchemas;
    this.enqueue = options.enqueue;
    this.onTask = options.onTask;
  }

  public start(): void {
    const intervalMs = this.intervalMinutes * 60 * 1000;
    logger.info(TAG, `Starting heartbeat scheduler every ${this.intervalMinutes} minutes.`);

    this.intervalId = setInterval(() => {
      this.enqueue(async () => {
        await this.checkHeartbeat();
      });
    }, intervalMs);

    this.enqueue(async () => {
      await this.checkHeartbeat();
    });
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info(TAG, 'Heartbeat scheduler stopped.');
    }
  }

  private async checkHeartbeat(): Promise<void> {
    logger.info(TAG, '💓 Heartbeat check triggered.');
    const heartbeatPath = path.join(this.workspace, 'HEARTBEAT.md');
    if (!FileUtil.exists(heartbeatPath)) {
      logger.info(TAG, 'HEARTBEAT.md not found, skipping.');
      return;
    }

    const content = FileUtil.readTextFile(heartbeatPath);
    if (!content.trim()) return;

    const currentTime = new Date().toLocaleString();
    const prompt = `你是一个后台调度分析器。
这里是计划执行配置文件 \`HEARTBEAT.md\` 的内容：
\`\`\`
${content}
\`\`\`
当前时间是：${currentTime}

请评估文件中列出的定时/条件任务。如果你认为某个任务在此刻应该被触发执行，请**直接**使用工具 \`finish\` 将最终结论作为结果返回（即需要被添加到队列里去执行的用户请求/指令）。例如直接返回对应任务的具体指令 "检查所有未读邮件"。
如果没有任何任务匹配当前时间的条件，请直接使用工具 \`finish\` 返回内容："NO_TASK"。
如果你检测到多个任务满足条件，可以直接合并成一个大的组合请求返回。`;

    logger.info(TAG, 'Querying LLM for Heartbeat events...');
    try {
      const result = await this.evaluatePrompt(prompt);
      if (result && result !== 'NO_TASK' && !result.includes('❌')) {
        logger.info(TAG, `Heartbeat triggered a task: ${result}`);
        this.onTask(`[AUTO-HEARTBEAT Triggered] ${result}`);
      } else {
        logger.info(TAG, 'No heartbeat task triggered at this time.');
      }
    } catch (e) {
      logger.error(TAG, `Error checking heartbeat: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private async evaluatePrompt(prompt: string): Promise<string> {
    await this.ensureInit();

    const history: Message[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ];

    const toolSchemas = this.getToolSchemas();
    const response: ChatResponse = await llmClient.chatCompletion(history, toolSchemas);

    if (response.status === 'error' || !response.tool_calls) {
      return 'NO_TASK';
    }

    for (const tc of response.tool_calls) {
      if (tc.name === 'finish') {
        return String(tc.arguments['result'] || 'NO_TASK');
      }
    }

    return 'NO_TASK';
  }
}
