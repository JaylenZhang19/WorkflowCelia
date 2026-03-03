import { InvokeResult, MockProviderToolCapability, QueryMessage } from "./AbilityTypes";


export abstract class AbsAbilityManager {
  protected allAbilities: MockProviderToolCapability[] = [];

  abstract loadAllAbilities(): Promise<void>;

  abstract handleQueryMessage(queryMessage: QueryMessage): Promise<InvokeResult>;

  public getAllAbilities(): MockProviderToolCapability[] {
    return this.allAbilities;
  }

  public hasAbility(namespace: string) {
    for (const definition of this.allAbilities) {
      if (definition.namespace === namespace) {
        return true;
      }
    }
    return false;
  }
}