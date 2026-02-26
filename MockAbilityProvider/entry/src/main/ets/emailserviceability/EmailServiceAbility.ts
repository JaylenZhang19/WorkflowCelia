import { AppServiceExtensionAbility, Want, common } from '@kit.AbilityKit';
import { rpc } from '@kit.IPCKit';
import {
  AbilityLinkProvider,
  AbilityLinkCapability,
  AbilityCategory,
  CapabilityDataType,
  InvokeResult,
  createProviderStub
} from 'ability_link';
import { logger } from '../utils/Logger';

const TAG = 'EmailServiceAbility';

/**
 * Email Capability Definition
 */
export const EMAIL_CAPABILITY: AbilityLinkCapability = {
  name: 'email.send',
  displayName: '发送邮件',
  description: '发送电子邮件到指定收件人',
  version: '1.0.0',
  category: AbilityCategory.COMMUNICATION,
  inputs: [
    { name: 'to', type: CapabilityDataType.ARRAY, required: true, description: '收件人列表' },
    { name: 'subject', type: CapabilityDataType.STRING, required: true, description: '邮件主题' },
    { name: 'body', type: CapabilityDataType.STRING, required: true, description: '邮件正文' },
    { name: 'cc', type: CapabilityDataType.ARRAY, required: false, description: '抄送人列表' },
    { name: 'bcc', type: CapabilityDataType.ARRAY, required: false, description: '密送人列表' },
    { name: 'isHtml', type: CapabilityDataType.BOOLEAN, required: false, description: '是否为 HTML 格式' }
  ],
  outputs: [
    { name: 'success', type: CapabilityDataType.BOOLEAN, required: true, description: '是否发送成功' },
    { name: 'messageId', type: CapabilityDataType.STRING, required: false, description: '消息 ID' }
  ],
  permissions: ['ohos.permission.INTERNET'],
  requiresConfirmation: false,
  serviceAbilityName: 'EmailServiceAbility'
};

/**
 * 邮件 AppServiceExtensionAbility
 */
export default class EmailServiceAbility extends AppServiceExtensionAbility {
  private provider: EmailAbilityProvider | null = null;

  onCreate(): void {
    logger.info(TAG, 'EmailServiceAbility onCreate');
    this.provider = new EmailAbilityProvider();
    void this.provider.initialize(this.context);
  }

  onDestroy(): void {
    logger.info(TAG, 'EmailServiceAbility onDestroy');
    this.provider?.dispose();
  }

  onConnect(want: Want): rpc.RemoteObject {
    logger.info(TAG, 'EmailServiceAbility onConnect');
    if (!this.provider) {
      this.provider = new EmailAbilityProvider();
      void this.provider.initialize(this.context);
    }
    return createProviderStub(this.provider);
  }

  async onStartCommand(want: Want, startId: number): Promise<void> {
    logger.info(TAG, `EmailServiceAbility onStartCommand, startId: ${startId}`);

    try {
      const to = want.parameters?.['to'] as string[];
      const subject = want.parameters?.['subject'] as string;
      const body = want.parameters?.['body'] as string;

      if (!to || to.length === 0 || !subject) {
        logger.error(TAG, 'Invalid parameters: missing recipients or subject');
        return;
      }

      const inputs: Record<string, Object> = {
        'to': to,
        'subject': subject,
        'body': body
      };
      const result = await this.provider?.invoke(inputs);
      logger.info(TAG, `Email send result: ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error(TAG, `Failed to handle Email request: ${JSON.stringify(err)}`);
    }
  }
}

/**
 * Email Ability Provider
 */
class EmailAbilityProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return EMAIL_CAPABILITY;
  }

  async invoke(inputs: Record<string, Object>): Promise<InvokeResult> {
    const validation = this.validateInputs(inputs);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        errorCode: 'INVALID_PARAMETERS'
      };
    }

    const to = inputs['to'] as string[];
    const subject = inputs['subject'] as string;
    const body = inputs['body'] as string;
    return this.sendEmail(to, subject, body);
  }

  private async sendEmail(to: string[], subject: string, body: string): Promise<InvokeResult> {
    await this.delay(800);

    const messageId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    logger.info(TAG, `Mock Email sent to ${JSON.stringify(to)}, messageId: ${messageId}`);

    return {
      success: true,
      outputs: {
        success: true,
        messageId: messageId
      },
      metadata: {
        provider: 'MockAbilityProvider',
        capability: 'email.send'
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, ms);
      void timer;
    });
  }
}
