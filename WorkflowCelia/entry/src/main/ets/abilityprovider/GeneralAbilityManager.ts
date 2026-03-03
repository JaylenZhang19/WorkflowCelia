import { logger } from "../core";
import { InvokeResult, MockProviderToolCapability, QueryMessage } from "./AbilityTypes";
import { LocalAbilityManager } from "./LocalAbilityManager";
import { RemoteAbilityManager } from "./RemoteAbilityManager";

const TAG: string = 'GeneralAbilityManager';

export class GeneralAbilityManager {
  private static readonly INSTANCE: GeneralAbilityManager = new GeneralAbilityManager();

  private isInit: boolean = false;

  private readonly ALL_ABILITIES:MockProviderToolCapability[] = [];

  private constructor() {
  }

  public static getInstance(): GeneralAbilityManager {
    return GeneralAbilityManager.INSTANCE;
  }

  private async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    await RemoteAbilityManager.getInstance().loadAllAbilities();
    await LocalAbilityManager.getInstance().loadAllAbilities();
    this.ALL_ABILITIES.concat(...RemoteAbilityManager.getInstance().getAllAbilities());
    this.ALL_ABILITIES.concat(...LocalAbilityManager.getInstance().getAllAbilities());
    this.isInit = true;
    return;
  }

  public async getAllAbilities(): Promise<MockProviderToolCapability[]> {
    await this.init();
    return this.ALL_ABILITIES;
  }

  public async handleQueryMessage(queryMessage: QueryMessage): Promise<InvokeResult> {
    await this.init();
    const namespace: string = queryMessage.header.namespace;
    const name: string = queryMessage.header.name;
    logger.info(TAG, `handleQueryMessage, namespace: ${namespace}, name: ${name}`);
    let result: InvokeResult = {
      success: false,
      errorCode: 'NAMESPACE_NOT_FOUND',
      error: `invalid namespace: ${queryMessage.header.namespace}`
    }
    if (RemoteAbilityManager.getInstance().hasAbility(name)) {
      result = await RemoteAbilityManager.getInstance().handleQueryMessage(queryMessage);
    } else if (LocalAbilityManager.getInstance().hasAbility(namespace)) {
      result = await LocalAbilityManager.getInstance().handleQueryMessage(queryMessage);
    }
    logger.info(TAG, `handleQueryMessage, result: ${JSON.stringify(result)}`);
    return result;
  }
}