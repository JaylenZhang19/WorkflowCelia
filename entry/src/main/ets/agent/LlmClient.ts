export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmClient {
  chat(messages: LlmChatMessage[]): Promise<string>;
}

export interface OpenAICompatibleConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

export class OpenAICompatibleClient implements LlmClient {
  private readonly config: OpenAICompatibleConfig;

  constructor(config: OpenAICompatibleConfig) {
    this.config = config;
  }

  isEnabled(): boolean {
    return (
      this.config.enabled &&
      this.config.baseUrl.trim().length > 0 &&
      this.config.apiKey.trim().length > 0 &&
      this.config.model.trim().length > 0
    );
  }

  async chat(messages: LlmChatMessage[]): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('LLM client is not configured.');
    }

    const endpoint = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const timeoutMs = Math.max(1000, this.config.timeoutMs ?? 20000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.1,
          messages
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`LLM HTTP ${res.status}: ${body}`);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content ?? '';
      if (!content.trim()) {
        throw new Error('Empty LLM response.');
      }
      return content;
    } finally {
      clearTimeout(timer);
    }
  }
}

