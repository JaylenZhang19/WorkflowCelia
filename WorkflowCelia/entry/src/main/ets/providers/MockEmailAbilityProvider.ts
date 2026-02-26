import { IAbilityProvider, AbilityMeta, AbilityDefinition, AbilityCategory, AbilityResult, AbilityContext } from '../abilities/IAbilityProvider';
import { common, Want } from '@kit.AbilityKit';
import { DataType } from '../core/models/DataType';
import { logger } from '../utils/Logger';

const TAG = 'MockEmailAbilityProvider';

/**
 * Mock Email Ability Provider
 * Provides Email sending capability via MockAbilityProvider
 */
export class MockEmailAbilityProvider implements IAbilityProvider {
  private static readonly TARGET_BUNDLE = 'com.pumpkin.mockabilityprovider';
  private static readonly TARGET_ABILITY = 'EmailServiceAbility';
  private static readonly ACTION = 'action.send.email';

  private meta: AbilityMeta = {
    id: 'mock.email.send',
    name: '发送邮件',
    description: '通过 MockAbilityProvider 发送邮件',
    provider: 'MockAbilityProvider',
    version: '1.0.0',
    category: AbilityCategory.COMMUNICATION,
    requiresConfirmation: false,
    permissions: ['ohos.permission.INTERNET']
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
          name: 'to',
          type: DataType.ARRAY,
          required: true,
          description: '收件人列表'
        },
        {
          name: 'subject',
          type: DataType.TEXT,
          required: true,
          description: '邮件主题'
        },
        {
          name: 'body',
          type: DataType.TEXT,
          required: true,
          description: '邮件正文'
        },
        {
          name: 'cc',
          type: DataType.ARRAY,
          required: false,
          description: '抄送人列表'
        },
        {
          name: 'bcc',
          type: DataType.ARRAY,
          required: false,
          description: '密送人列表'
        },
        {
          name: 'isHtml',
          type: DataType.BOOLEAN,
          required: false,
          description: '是否为 HTML 格式'
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
    return true;
  }

  async initialize(): Promise<void> {
    logger.info(TAG, 'MockEmailAbilityProvider initialized');
  }

  /**
   * Execute Email sending via cross-app Want
   */
  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    logger.info(TAG, `Executing Email ability, inputs: ${JSON.stringify(inputs)}`);

    try {
      const { to, subject, body, cc, bcc, isHtml } = inputs;

      if (!to || to.length === 0 || !subject) {
        return {
          success: false,
          error: 'Missing required parameters: recipients or subject',
          errorCode: 'INVALID_PARAMETERS'
        };
      }

      // Use Want to call MockAbilityProvider's EmailExtensionAbility
      if (this.context) {
        const result = await this.sendEmailViaWant(to, subject, body, cc, bcc, isHtml);
        return result;
      }

      // Fallback: mock execution
      return this.mockExecute(to, subject, body);
    } catch (err) {
      logger.error(TAG, `Failed to execute Email ability: ${JSON.stringify(err)}`);
      return {
        success: false,
        error: `Execution failed: ${JSON.stringify(err)}`,
        errorCode: 'EXECUTION_ERROR'
      };
    }
  }

  /**
   * Send Email via Want (cross-app communication)
   */
  private async sendEmailViaWant(
    to: string[],
    subject: string,
    body: string,
    cc: string[] | undefined,
    bcc: string[] | undefined,
    isHtml: boolean | undefined
  ): Promise<AbilityResult> {
    try {
      // Create Want to call MockAbilityProvider
      const wantInfo: Want = {
        bundleName: MockEmailAbilityProvider.TARGET_BUNDLE,
        abilityName: MockEmailAbilityProvider.TARGET_ABILITY,
        action: MockEmailAbilityProvider.ACTION,
        parameters: {
          to: to,
          subject: subject,
          body: body,
          cc: cc || [],
          bcc: bcc || [],
          isHtml: isHtml || false
        }
      };

      // Start the ability
      await this.context.startAbility(wantInfo);

      logger.info(TAG, `Email Want sent successfully to ${JSON.stringify(to)}`);

      return {
        success: true,
        outputs: {
          success: true,
          messageId: `EMAIL_${Date.now()}`
        },
        metadata: {
          provider: MockEmailAbilityProvider.TARGET_BUNDLE,
          ability: MockEmailAbilityProvider.TARGET_ABILITY
        }
      };
    } catch (err) {
      logger.error(TAG, `Failed to send Email via Want: ${JSON.stringify(err)}`);
      // Fallback to mock execution
      return this.mockExecute(to, subject, body);
    }
  }

  /**
   * Mock execution when cross-app communication is not available
   */
  private mockExecute(to: string[], subject: string, body: string): AbilityResult {
    logger.info(TAG, `[MOCK] Email sent to ${JSON.stringify(to)}, subject: ${subject}`);

    return {
      success: true,
      outputs: {
        success: true,
        messageId: `MOCK_EMAIL_${Date.now()}`
      },
      metadata: {
        mock: true
      }
    };
  }

  dispose(): void {
    this.context = null;
    logger.info(TAG, 'MockEmailAbilityProvider disposed');
  }
}
