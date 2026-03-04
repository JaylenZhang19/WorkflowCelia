import { InvokeResult, QueryMessage } from '../abilityprovider/AbilityTypes';

export type ReActStepType = 'thought' | 'skill' | 'action' | 'observation' | 'final';

export interface AgentStepEvent {
  type: ReActStepType;
  title: string;
  content: string;
  timestamp: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  allowedTools: Array<{ namespace: string; name: string }>;
}

export interface ToolPlan {
  reason: string;
  query: QueryMessage;
}

export interface AgentTurnInput {
  sessionId: string;
  input: string;
}

export interface AgentTurnResult {
  finalText: string;
  steps: AgentStepEvent[];
}

export interface AgentSessionTurn {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export interface AgentSessionSnapshot {
  sessionId: string;
  turns: AgentSessionTurn[];
}

export interface ToolExecutionResult {
  query: QueryMessage;
  result: InvokeResult;
}

