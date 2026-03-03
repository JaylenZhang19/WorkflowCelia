import { InvokeResult, QueryMessage } from "./AbilityTypes";
import { AbsAbilityManager } from "./AbsAbilityManager";

export class RemoteAbilityManager extends AbsAbilityManager {
  private static readonly INSTANCE: AbsAbilityManager = new RemoteAbilityManager();

  private constructor() {
    super()
  }

  public static getInstance(): AbsAbilityManager {
    return RemoteAbilityManager.INSTANCE;
  }

  loadAllAbilities(): Promise<void> {
    return;
  }

  handleQueryMessage(queryMessage: QueryMessage): Promise<InvokeResult> {
    throw new Error("Method not implemented.");
  }
}