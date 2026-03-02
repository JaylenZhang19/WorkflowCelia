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

  public handleQueryMessage(queryMessage: QueryMessage): Promise<InvokeResult> {
    const namespace: string = queryMessage.header.namespace;
    const name: string = queryMessage.header.name;
    logger.info(TAG, `handleQueryMessage, namespace: ${namespace}, name: ${name}`);
    if (!AbilityProviderManager.ABILITY_MAP.has(queryMessage.header.namespace)) {
      logger.error(TAG, `handleQueryMessage, invalid namespace: ${queryMessage.header.namespace}`);
    }
    return AbilityProviderManager.ABILITY_MAP.get(namespace)?.handleRequest(name, queryMessage.payload.args);
  }

  private constructor() {
  }
}