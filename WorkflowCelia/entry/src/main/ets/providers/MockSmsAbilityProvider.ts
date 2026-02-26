import { IAbilityProvider, AbilityMeta, AbilityDefinition, AbilityCategory, AbilityResult, AbilityContext } from '../abilities/IAbilityProvider';
import { common, Want } from '@kit.AbilityKit';
import { DataType } from '../core/models/DataType';
import { logger } from '../utils/Logger';

const TAG = 'MockSmsAbilityProvider';

/**
 * Mock SMS Ability Provider
 * Provides SMS sending capability via MockAbilityProvider
 */
export class MockSmsAbilityProvider implements IAbilityProvider {
  private static readonly TARGET_BUNDLE = 'com.pumpkin.mockabilityprovider';
  private static readonly TARGET_ABILITY = 'SmsServiceAbility';
  private static readonly ACTION = 'action.send.sms';

  private meta: AbilityMeta = {
    id: 'mock.sms.send',
    name: '发送短信',
    description: '通过 MockAbilityProvider 发送短信',
    provider: 'MockAbilityProvider',
    version: '1.0.0',
    category: AbilityCategory.COMMUNICATION,
    requiresConfirmation: false,
    permissions: ['ohos.permission.SEND_MESSAGES']
  };

  private context: common.UIAbilityContext | null = null;

  /**
   * Set context for cross-app communication
   */
  setContext(context: common.UIAbilityContext): void {
    this.context = context;
  }

  getMeta(): AbilityMeta {
    return this.meta;
  }

  getDefinition(): AbilityDefinition {
    return {
      meta: this.meta,
      inputs: [
        {
          name: 'phoneNumber',
          type: DataType.TEXT,
          required: true,
          description: '接收方电话号码'
        },
        {
          name: 'message',
          type: DataType.TEXT,
          required: true,
          description: '短信内容'
        }
      ],
      outputs: [
        {
          name: 'success',
          type: DataType.BOOLEAN,
          required: true,
          description: '是否发送成功'
        },
        {
          name: 'messageId',
          type: DataType.TEXT,
          required: false,
          description: '消息 ID'
        }
      ]
    };
  }

  async isAvailable(): Promise<boolean> {
    // In real scenario, check if MockAbilityProvider is installed
    return true;
  }

  async initialize(): Promise<void> {
    logger.info(TAG, 'MockSmsAbilityProvider initialized');
  }

  /**
   * Execute SMS sending via cross-app Want
   */
  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    logger.info(TAG, `Executing SMS ability, inputs: ${JSON.stringify(inputs)}`);

    try {
      const { phoneNumber, message } = inputs;

      if (!phoneNumber || !message) {
        return {
          success: false,
          error: 'Missing required parameters: phoneNumber or message',
          errorCode: 'INVALID_PARAMETERS'
        };
      }

      // Use Want to call MockAbilityProvider's SmsExtensionAbility
      if (this.context) {
        const result = await this.sendSmsViaWant(phoneNumber, message);
        return result;
      }

      // Fallback: mock execution
      return this.mockExecute(phoneNumber, message);
    } catch (err) {
      logger.error(TAG, `Failed to execute SMS ability: ${JSON.stringify(err)}`);
      return {
        success: false,
        error: `Execution failed: ${JSON.stringify(err)}`,
        errorCode: 'EXECUTION_ERROR'
      };
    }
  }

  /**
   * Send SMS via Want (cross-app communication)
   */
  private async sendSmsViaWant(phoneNumber: string, message: string): Promise<AbilityResult> {
    try {
      // Create Want to call MockAbilityProvider
      const wantInfo: Want = {
        bundleName: MockSmsAbilityProvider.TARGET_BUNDLE,
        abilityName: MockSmsAbilityProvider.TARGET_ABILITY,
        action: MockSmsAbilityProvider.ACTION,
        parameters: {
          phoneNumber: phoneNumber,
          message: message
        }
      };

      // Start the ability
      await this.context.startAbility(wantInfo);

      logger.info(TAG, `SMS Want sent successfully to ${phoneNumber}`);

      return {
        success: true,
        outputs: {
          success: true,
          messageId: `SMS_${Date.now()}`
        },
        metadata: {
          provider: MockSmsAbilityProvider.TARGET_BUNDLE,
          ability: MockSmsAbilityProvider.TARGET_ABILITY
        }
      };
    } catch (err) {
      logger.error(TAG, `Failed to send SMS via Want: ${JSON.stringify(err)}`);
      // Fallback to mock execution
      return this.mockExecute(phoneNumber, message);
    }
  }

  /**
   * Mock execution when cross-app communication is not available
   */
  private mockExecute(phoneNumber: string, message: string): AbilityResult {
    logger.info(TAG, `[MOCK] SMS sent to ${phoneNumber}, content: ${message}`);

    return {
      success: true,
      outputs: {
        success: true,
        messageId: `MOCK_SMS_${Date.now()}`
      },
      metadata: {
        mock: true
      }
    };
  }

  dispose(): void {
    this.context = null;
    logger.info(TAG, 'MockSmsAbilityProvider disposed');
  }
}
