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