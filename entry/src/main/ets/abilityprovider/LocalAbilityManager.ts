import { logger } from "../utils";
import { InvokeResult, QueryMessage } from "./AbilityTypes";
import { AbsAbilityManager } from "./AbsAbilityManager";
import { AbsAbilityHandler } from "./localprovider/abilityhandler/AbsAbilityHandler";
import { CalendarHandler } from "./localprovider/abilityhandler/CalendarHandler";
import { MOCK_PROVIDER_TOOLS } from "./localprovider/LocalCapabilityConfig";

const TAG: string = 'LocalAbilityManager';

export class LocalAbilityManager extends AbsAbilityManager {
  private static readonly INSTANCE: LocalAbilityManager = new LocalAbilityManager();

  private static readonly HANDLER_MAP: Map<string, AbsAbilityHandler> = new Map([
    ['Calendar', new CalendarHandler()],
  ]);

  private constructor() {
    super();
  }

  public static getInstance(): LocalAbilityManager {
    return LocalAbilityManager.INSTANCE;
  }

  loadAllAbilities(): Promise<void> {
    this.allAbilities = MOCK_PROVIDER_TOOLS;
    return;
  }

  public async handleQueryMessage(queryMessage: QueryMessage): Promise<InvokeResult> {
    const namespace: string = queryMessage.header.namespace;
    const name: string = queryMessage.header.name;
    logger.info(TAG, `handleQueryMessage, namespace: ${namespace}, name: ${name}`);
    if (!LocalAbilityManager.HANDLER_MAP.has(queryMessage.header.namespace)) {
      logger.error(TAG, `handleQueryMessage, invalid namespace: ${queryMessage.header.namespace}`);
      return {
        success: false,
        errorCode: 'NAMESPACE_NOT_FOUND',
        error: `invalid namespace: ${queryMessage.header.namespace}`
      };
    }
    const handler: AbsAbilityHandler | undefined = LocalAbilityManager.HANDLER_MAP.get(namespace);
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
}
