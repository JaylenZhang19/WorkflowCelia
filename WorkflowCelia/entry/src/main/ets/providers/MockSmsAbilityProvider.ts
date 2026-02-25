import { IAbilityProvider, AbilityMeta, AbilityDefinition, AbilityCategory, AbilityResult, AbilityContext } from '../abilities/IAbilityProvider';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { common, Want } from '@kit.AbilityKit';
import { DataType } from '../core/models/DataType';

const DOMAIN = 0x2000;
const TAG = 'MockSmsAbilityProvider';

/**
 * Mock SMS Ability Provider
 * Provides SMS sending capability via MockAbilityProvider
 */
export class MockSmsAbilityProvider implements IAbilityProvider {
  private static readonly TARGET_BUNDLE = 'com.example.mockabilityprovider';
  private static readonly TARGET_ABILITY = 'SmsServiceExtension';
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
    hilog.info(DOMAIN, TAG, 'MockSmsAbilityProvider initialized');
  }

  /**
   * Execute SMS sending via cross-app Want
   */
  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    hilog.info(DOMAIN, TAG, 'Executing SMS ability, inputs: %{public}s', JSON.stringify(inputs));

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
      hilog.error(DOMAIN, TAG, 'Failed to execute SMS ability: %{public}s', JSON.stringify(err));
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

      hilog.info(DOMAIN, TAG, 'SMS Want sent successfully to %{public}s', phoneNumber);

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
      hilog.error(DOMAIN, TAG, 'Failed to send SMS via Want: %{public}s', JSON.stringify(err));
      // Fallback to mock execution
      return this.mockExecute(phoneNumber, message);
    }
  }

  /**
   * Mock execution when cross-app communication is not available
   */
  private mockExecute(phoneNumber: string, message: string): AbilityResult {
    hilog.info(DOMAIN, TAG, '[MOCK] SMS sent to %{public}s, content: %{public}s', phoneNumber, message);

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
    hilog.info(DOMAIN, TAG, 'MockSmsAbilityProvider disposed');
  }
}
