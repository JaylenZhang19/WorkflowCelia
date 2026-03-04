import { OpenAICompatibleConfig } from './LlmClient';

/**
 * Configure real LLM planner here.
 * Keep disabled by default to avoid accidental network calls in demo.
 */
export const DEFAULT_LLM_CONFIG: OpenAICompatibleConfig = {
  enabled: false,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  timeoutMs: 20000
};

