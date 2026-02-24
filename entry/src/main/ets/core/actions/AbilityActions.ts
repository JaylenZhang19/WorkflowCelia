/**
 * Ability-based Actions
 * Actions that use the new ability provider layer
 */

import {
  AbilityCommunicationManager,
  AbilityRegistry,
  IAbilityProvider,
  AbilityContext,
  AbilityCategory
} from '../../abilities';
import {
  ActionDefinition,
  ActionExecutor,
  ActionResult,
  createActionDefinition,
  IWorkflowContext
} from '../models/Action';
import { DataType } from '../models/DataType';
import { logger } from '../../utils/Logger';

/**
 * Base class for ability-backed actions
 */
export abstract class AbilityBackedAction implements ActionExecutor {
  protected abilityId: string = '';
  protected abilityProvider?: IAbilityProvider;
  protected definition!: ActionDefinition;
  protected communicationManager: AbilityCommunicationManager;

  constructor() {
    this.communicationManager = AbilityCommunicationManager.getInstance();
    this.initialize();
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  protected initialize(): void {
    const registry = AbilityRegistry.getInstance();
    this.abilityProvider = registry.getAbility(this.abilityId);

    if (this.abilityProvider) {
      const abilityDef = this.abilityProvider.getDefinition();
      
      // Convert ability definition to action definition
      this.definition = createActionDefinition({
        id: this.abilityId.replace(/\./g, '_'),
        name: abilityDef.meta.name,
        description: abilityDef.meta.description,
        category: abilityDef.meta.category,
        inputs: abilityDef.inputs.map(input => ({
          name: input.name,
          type: input.type,
          required: input.required,
          default: input.default,
          description: input.description,
          isArray: input.isArray
        })),
        outputs: abilityDef.outputs.map(output => ({
          name: output.name,
          type: output.type,
          required: output.required,
          default: output.default,
          description: output.description,
          isArray: output.isArray
        })),
        version: abilityDef.meta.version
      });
    }
  }

  abstract execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult>;

  protected createAbilityContext(workflowContext: IWorkflowContext): AbilityContext {
    return {
      getVariable: (name: string) => workflowContext.getVariable(name),
      setVariable: (name: string, value: any, dataType: DataType) => 
        workflowContext.setVariable(name, value, dataType),
      log: (level, message, data) => workflowContext.log(level, message, data),
      isCancelled: () => workflowContext.isCancelled(),
      requestConfirmation: async (message: string) => {
        // TODO: Implement user confirmation dialog
        logger.warn('AbilityBackedAction', `Confirmation requested: ${message}`);
        return true;
      }
    };
  }
}

/**
 * System Action: Send SMS
 */
export class SendSmsAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.system.sms';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const abilityContext = this.createAbilityContext(context);
      
      // Use communication manager to invoke ability
      const result = await this.communicationManager.invokeAbility(
        'com.ohos.system',
        'sms',
        'send',
        inputs
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS'
      };
    }
  }
}

/**
 * System Action: Set Alarm
 */
export class SetAlarmAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.system.alarm';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const abilityContext = this.createAbilityContext(context);
      
      const result = await this.communicationManager.invokeAbility(
        'com.ohos.system',
        'alarm',
        'set',
        { ...inputs, action: 'set' }
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set alarm'
      };
    }
  }
}

/**
 * System Action: Create Geofence
 */
export class CreateGeofenceAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.system.geofence';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const result = await this.communicationManager.invokeAbility(
        'com.ohos.system',
        'geofence',
        'create',
        { ...inputs, action: 'create' }
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create geofence'
      };
    }
  }
}

/**
 * System Action: Get Device Status
 */
export class GetDeviceStatusAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.system.devicestatus';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const result = await this.communicationManager.invokeAbility(
        'com.ohos.system',
        'devicestatus',
        'get',
        inputs
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get device status'
      };
    }
  }
}

/**
 * Third-party Action: Send WeChat Message
 */
export class SendWeChatMessageAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.tencent.wechat.sendmessage';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const result = await this.communicationManager.invokeAbility(
        'com.tencent.wechat',
        'sendmessage',
        'send',
        inputs
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WeChat message'
      };
    }
  }
}

/**
 * Third-party Action: Search Taobao Products
 */
export class SearchTaobaoProductsAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.taobao.searchproducts';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const result = await this.communicationManager.invokeAbility(
        'com.taobao',
        'searchproducts',
        'search',
        inputs
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search products'
      };
    }
  }
}

/**
 * Third-party Action: Alipay Payment
 */
export class AlipayPaymentAction extends AbilityBackedAction {
  constructor() {
    super();
    this.abilityId = 'com.alipay.payment';
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const result = await this.communicationManager.invokeAbility(
        'com.alipay',
        'payment',
        'pay',
        inputs
      );

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment'
      };
    }
  }
}

/**
 * Factory to create ability-backed actions from registry
 */
export class AbilityActionFactory {
  /**
   * Create an action executor for a given ability
   * @param abilityId - The ability identifier
   */
  static createAction(abilityId: string): ActionExecutor | null {
    const registry = AbilityRegistry.getInstance();
    const provider = registry.getAbility(abilityId);

    if (!provider) {
      logger.warn('AbilityActionFactory', `Ability not found: ${abilityId}`);
      return null;
    }

    return new GenericAbilityAction(abilityId, provider);
  }

  /**
   * Get all available actions from registry
   */
  static getAllActions(): ActionExecutor[] {
    const registry = AbilityRegistry.getInstance();
    const abilities = registry.getAllAbilities();

    return abilities.map(ability => {
      const meta = ability.getMeta();
      return new GenericAbilityAction(`${meta.provider}.${meta.id}`, ability);
    });
  }
}

/**
 * Generic ability-backed action
 */
export class GenericAbilityAction extends AbilityBackedAction {
  constructor(abilityId: string, provider: IAbilityProvider) {
    super();
    this.abilityId = abilityId;
    this.abilityProvider = provider;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      if (!this.abilityProvider) {
        return {
          success: false,
          error: `Ability not found: ${this.abilityId}`
        };
      }

      const abilityContext = this.createAbilityContext(context);
      const result = await this.abilityProvider.execute(inputs, abilityContext);

      return {
        success: result.success,
        outputs: result.outputs || {},
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ability execution failed'
      };
    }
  }
}

// Export all ability-based actions
export const ABILITY_ACTIONS = [
  SendSmsAction,
  SetAlarmAction,
  CreateGeofenceAction,
  GetDeviceStatusAction,
  SendWeChatMessageAction,
  SearchTaobaoProductsAction,
  AlipayPaymentAction
];
