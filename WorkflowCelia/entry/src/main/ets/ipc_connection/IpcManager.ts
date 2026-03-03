import { InvokeResult } from "ability_link/src/main/ets/types";
import { AbilityProviderManager } from "../mockProvider/AbilityProviderManager";
import {
  buildQueryMessage,
  buildQueryMessageByToolId,
  getMockProviderTool,
  getMockProviderTools,
  MockProviderToolCapability
} from "../mockProvider/ToolCapabilityConfig";
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

  public getTools(): MockProviderToolCapability[] {
    return getMockProviderTools();
  }

  public getTool(namespace: string, name: string): MockProviderToolCapability | null {
    return getMockProviderTool(namespace, name);
  }

  public async dispatchMessage(queryMessage: QueryMessage): Promise<InvokeResult> {
    const result: InvokeResult = await AbilityProviderManager.getInstance().handleQueryMessage(queryMessage);
    logger.info(TAG, `dispatchMessage, result: ${JSON.stringify(result)}`);
    return result;
  }

  public async invokeByNamespaceName(namespace: string, name: string, args: Record<string, any>): Promise<InvokeResult> {
    const queryMessage: QueryMessage = buildQueryMessage(namespace, name, args);
    return this.dispatchMessage(queryMessage);
  }

  public async invokeByToolId(toolId: string, args: Record<string, any>): Promise<InvokeResult> {
    const queryMessage: QueryMessage | null = buildQueryMessageByToolId(toolId, args);
    if (!queryMessage) {
      const result: InvokeResult = {
        success: false,
        errorCode: 'TOOL_NOT_FOUND',
        error: `toolId is invalid: ${toolId}`
      };
      logger.error(TAG, `invokeByToolId failed: ${JSON.stringify(result)}`);
      return result;
    }
    return this.dispatchMessage(queryMessage);
  }
}
