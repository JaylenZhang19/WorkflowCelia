import { logger } from '../utils';
import { ChatResponse, Message, ToolCallRequest, VllmOptions } from './types';
import { ModelConfig, ProjectContext } from '../env/ProjectContext';

const TAG = 'LLMClient';

export class LLMClient {
  private defaultOptions: VllmOptions = {
    max_tokens: 4096,
    temperature: 0.7,
    logprobs: true,
    top_logprobs: 1
  };

  /**
   * 计算困惑度 (Perplexity)
   */
  private calcPpl(logprobs: number[]): number {
    if (logprobs.length === 0) return 0;
    const t = logprobs.length;
    const sumLogprobs = logprobs.reduce((a, b) => a + b, 0);
    return Math.exp(-(1 / t) * sumLogprobs);
  }

  /**
   * 鲁棒的 JSON 解析
   */
  private robustParseJson(jsonStr: string): Record<string, any> {
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // 简单修复：去除 Markdown 槽位
      let cleaned = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (err) {
        return { "raw_arguments": jsonStr, "error": "PARSE_FAILED" };
      }
    }
  }

  /**
   * 解析模型返回的消息体
   */
  private parseMessage(choice: any): ChatResponse {
    const message = choice.message;
    const content = message?.content || "";
    const tool_calls_raw = message?.tool_calls || [];
    const tool_calls: ToolCallRequest[] = [];

    if (Array.isArray(tool_calls_raw)) {
      for (const tc of tool_calls_raw) {
        const argsStr = typeof tc.function.arguments === 'string'
          ? tc.function.arguments
          : JSON.stringify(tc.function.arguments);

        tool_calls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: this.robustParseJson(argsStr)
        });
      }
    }

    const result: ChatResponse = {
      content: content,
      tool_calls: tool_calls.length > 0 ? tool_calls : [],
      status: 'success'
    };

    // 处理 PPL (Perplexity)
    if (choice.logprobs?.content) {
      const probs = (choice.logprobs.content as any[]).map(c => c.logprob);
      result.ppl = this.calcPpl(probs);
    }

    return result;
  }

  /**
   * 统一聊天接口
   */
  async chatCompletion(messages: Message[], tools: Array<any> | null = null): Promise<ChatResponse> {
    const modelConfig: ModelConfig = ProjectContext.getInstance().config.model;
    return this.requestHttp(modelConfig.apiUrl, modelConfig.apiKey, modelConfig.modelName, messages, tools);
  }

  /**
   * 核心 HTTP 请求逻辑 (Node.js fetch)
   */
  private async requestHttp(
    url: string,
    apiKey: string,
    model: string,
    messages: Message[],
    tools: any[] | null,
    retries: number = 2
  ): Promise<ChatResponse> {
    const requestData = {
      model: model,
      messages: messages,
      ...this.defaultOptions,
      tools: tools || undefined
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!res.ok) {
        if (retries > 0 && (res.status >= 500 || res.status === 429)) {
          logger.info(TAG, `Retring... Attempts left: ${retries}`);
          return await this.requestHttp(url, apiKey, model, messages, tools, retries - 1);
        }
        return {
          status: 'error',
          content: `网络失败 code: ${res.status}`,
          errorCode: res.status,
          tool_calls: []
        };
      }

      const resObj = await res.json();
      if (resObj.choices && resObj.choices.length > 0) {
        const parsed = this.parseMessage(resObj.choices[0]);
        parsed.status = 'success';
        return parsed;
      }

      return { status: 'error', content: "No choices", tool_calls: [] };

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(TAG, `Request failed: ${message}`);
      if (retries > 0) {
        return await this.requestHttp(url, apiKey, model, messages, tools, retries - 1);
      }
      return { status: 'error', content: message, tool_calls: [] };
    }
  }
}

export const llmClient = new LLMClient();
