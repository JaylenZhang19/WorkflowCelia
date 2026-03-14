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
  tool_calls: ToolCallRequest[];
  ppl?: number;
  status: 'success' | 'error';
  errorCode?: number | string;
}

export interface Message {
  role: string;
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export type AgentStepType = 'thought' | 'skill' | 'action' | 'observation' | 'final';

export interface AgentStepEvent {
  type: AgentStepType;
  title: string;
  content: string;
  timestamp: number;
}

export interface AgentCallbacks {
  onStep?: (step: AgentStepEvent) => void;
}
