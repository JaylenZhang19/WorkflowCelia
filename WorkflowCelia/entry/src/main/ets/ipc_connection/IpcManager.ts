import { InvokeResult } from "ability_link/src/main/ets/types";
import { AbilityProviderManager } from "../mockProvider/AbilityProviderManager";
import { logger } from "../utils";
import { QueryMessage } from "./CallType";

const TAG: string = 'IpcManager';

export class IpcManager {
  private static readonly INSTANCE: IpcManager = new IpcManager();

  private constructor() {
  }

  public static getInstance(): IpcManager {
    return IpcManager.INSTANCE;
  }

  private async dispatchMessage(namespace: string, name: string, args: Record<string, object>): Promise<InvokeResult> {
    const queryMessage: QueryMessage = {
      header: {
        namespace: namespace,
        name: name,
      },
      payload: {
        args: args
      }
    }
    const result: InvokeResult = await AbilityProviderManager.getInstance().handleQueryMessage(queryMessage);
    logger.info(TAG, `dispatchMessage, result: ${JSON.stringify(result)}`);
    return result;
  }
}