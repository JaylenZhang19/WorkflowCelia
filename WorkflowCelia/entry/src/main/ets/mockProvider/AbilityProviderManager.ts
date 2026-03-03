import { InvokeResult } from "ability_link/src/main/ets/types";
import { QueryMessage } from "../ipc_connection/CallType";
import { logger } from "../utils";
import { AbilityHandler } from "./AbilityHandler";
import { CalendarHandler } from "./CalendarHandler";

const TAG: string = 'AbilityProviderManager';

export class AbilityProviderManager {
  private static readonly INSTANCE: AbilityProviderManager = new AbilityProviderManager();

  private static readonly ABILITY_MAP: Map<string, AbilityHandler> = new Map([
    ['Calendar', new CalendarHandler()],
  ]);

  public static getInstance(): AbilityProviderManager {
    return AbilityProviderManager.INSTANCE;
  }

  public async handleQueryMessage(queryMessage: QueryMessage): Promise<InvokeResult> {
    const namespace: string = queryMessage.header.namespace;
    const name: string = queryMessage.header.name;
    logger.info(TAG, `handleQueryMessage, namespace: ${namespace}, name: ${name}`);
    if (!AbilityProviderManager.ABILITY_MAP.has(queryMessage.header.namespace)) {
      logger.error(TAG, `handleQueryMessage, invalid namespace: ${queryMessage.header.namespace}`);
      return {
        success: false,
        errorCode: 'NAMESPACE_NOT_FOUND',
        error: `invalid namespace: ${queryMessage.header.namespace}`
      };
    }
    const handler: AbilityHandler | undefined = AbilityProviderManager.ABILITY_MAP.get(namespace);
    if (!handler) {
      return {
        success: false,
        errorCode: 'HANDLER_NOT_FOUND',
        error: `handler not found for namespace: ${namespace}`
      };
    }
    try {
      await handler.init();
      return handler.handleRequest(name, queryMessage.payload.args);
    } catch (error) {
      logger.error(TAG, `handleQueryMessage error: ${JSON.stringify(error)}`);
      return {
        success: false,
        errorCode: 'INVOKE_FAILED',
        error: JSON.stringify(error)
      };
    }
  }

  private constructor() {
  }
}
