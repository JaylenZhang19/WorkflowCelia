import { AgentSessionSnapshot, AgentSessionTurn } from './types';

export class SessionStore {
  private readonly maxTurns: number;
  private readonly sessionMap: Map<string, AgentSessionTurn[]> = new Map();

  constructor(maxTurns = 40) {
    this.maxTurns = Math.max(2, maxTurns);
  }

  appendTurn(sessionId: string, turn: AgentSessionTurn): void {
    const turns = this.sessionMap.get(sessionId) ?? [];
    turns.push(turn);
    if (turns.length > this.maxTurns) {
      turns.splice(0, turns.length - this.maxTurns);
    }
    this.sessionMap.set(sessionId, turns);
  }

  getSnapshot(sessionId: string): AgentSessionSnapshot {
    return {
      sessionId,
      turns: [...(this.sessionMap.get(sessionId) ?? [])]
    };
  }
}

