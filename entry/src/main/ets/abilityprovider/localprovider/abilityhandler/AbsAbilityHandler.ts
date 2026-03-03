import { InvokeResult } from "../../AbilityTypes";

export abstract class AbsAbilityHandler {
  protected NAME_MAP: Map<string, (args: Record<string, object>) => Promise<InvokeResult>>;

  public abstract init(): Promise<void>;

  public abstract handleRequest(name: string, args: Record<string, any>): Promise<InvokeResult>;

  public abstract getNamespace(): string;

  public isAvailable(name: string): boolean {
    return this.NAME_MAP.has(name);
  }
}