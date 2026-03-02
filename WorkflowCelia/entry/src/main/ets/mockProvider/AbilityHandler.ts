import { InvokeResult } from "ability_link/src/main/ets/types";

export abstract class AbilityHandler {
  protected NAME_MAP: Map<string, (args: Record<string, object>) => Promise<InvokeResult>>;

  public abstract init(): Promise<void>;

  public abstract handleRequest(name: string, args: Record<string, object>): Promise<InvokeResult>;

  public isAvailable(name: string): boolean {
    return this.NAME_MAP.has(name);
  }
}