import { GeneralAbilityManager } from '../abilityprovider/GeneralAbilityManager';
import { InvokeResult, QueryMessage } from '../abilityprovider/AbilityTypes';
import { ToolExecutionResult } from './types';

export class ToolRegistry {
  private readonly abilityManager: GeneralAbilityManager;

  constructor(abilityManager?: GeneralAbilityManager) {
    this.abilityManager = abilityManager ?? GeneralAbilityManager.getInstance();
  }

  async invoke(query: QueryMessage): Promise<ToolExecutionResult> {
    const result: InvokeResult = await this.abilityManager.handleQueryMessage(query);
    return { query, result };
  }
}

