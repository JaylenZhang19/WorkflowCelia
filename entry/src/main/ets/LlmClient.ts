import { http } from '@kit.NetworkKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { logger } from './utils';

/**
 * 推理配置选项
 */
export interface VllmOptions {
  frequency_penalty?: number;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  logprobs?: boolean;
  top_logprobs?: number;
  stop?: string | string[];
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ChatResponse {
  content: string;
  tool_calls: ToolCallRequest[] | null;
  ppl?: number;
}

const TAG = 'LLMClient';

export class LLMClient {
  private host: string = "http://10.137.62.162:11435";
  private model: string = "Qwen2-72B-Instruct-GPTQ-Int4";
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
    const tool_calls_raw = message?.tool_calls || null;
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
      tool_calls: tool_calls.length > 0 ? tool_calls : null
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
  async chatCompletion(
    messages: Array<{role: string, content: string}>,
    tools: Array<any> | null = null,
    modelOverride?: string
  ): Promise<ChatResponse> {
    const model = modelOverride || this.model;

    // 根据模型名选择不同的路由（模拟 Python 中的 chat_with_doubao 等）
    if (model.includes('doubao')) {
      return this.requestHttp("https://ark.cn-beijing.volces.com/api/v3/chat/completions", "YOUR_ARK_KEY", model, messages, tools);
    }

    // 默认走 vLLM 宿主地址
    return this.requestHttp(`${this.host}/v1/chat/completions`, "no-key-needed", model, messages, tools);
  }

  /**
   * 核心 HTTP 请求逻辑 (使用 @kit.NetworkKit)
   */
  private async requestHttp(
    url: string,
    apiKey: string,
    model: string,
    messages: any[],
    tools: any[] | null
  ): Promise<ChatResponse> {
    let httpRequest = http.createHttp();

    const requestData = {
      model: model,
      messages: messages,
      ...this.defaultOptions,
      tools: tools || undefined
    };

    try {
      const response = await httpRequest.request(url, {
        method: http.RequestMethod.POST,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        extraData: JSON.stringify(requestData),
        expectDataType: http.HttpDataType.OBJECT,
        connectTimeout: 60000,
        readTimeout: 60000
      });

      if (response.responseCode !== http.ResponseCode.OK) {
        return { content: `Error: HTTP ${response.responseCode}`, tool_calls: null };
      }

      const resObj = response.result as any;
      if (resObj.choices && resObj.choices.length > 0) {
        return this.parseMessage(resObj.choices[0]);
      }

      return { content: "Error: No choices in response", tool_calls: null };

    } catch (err) {
      const bError = err as BusinessError;
      logger.error(TAG, `Request failed: ${bError.message}`);
      return { content: `Request Exception: ${bError.message}`, tool_calls: null };
    } finally {
      httpRequest.destroy();
    }
  }
}

export const llmClient = new LLMClient();