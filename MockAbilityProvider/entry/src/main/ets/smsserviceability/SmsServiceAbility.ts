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

const TAG = 'SmsServiceAbility';

/**
 * SMS Capability Definition
 */
export const SMS_CAPABILITY: AbilityLinkCapability = {
  name: 'sms.send',
  displayName: '发送短信',
  description: '发送短信到指定号码',
  version: '1.0.0',
  category: AbilityCategory.COMMUNICATION,
  inputs: [
    { name: 'phoneNumber', type: CapabilityDataType.STRING, required: true, description: '接收方电话号码' },
    { name: 'message', type: CapabilityDataType.STRING, required: true, description: '短信内容' }
  ],
  outputs: [
    { name: 'success', type: CapabilityDataType.BOOLEAN, required: true, description: '是否发送成功' },
    { name: 'messageId', type: CapabilityDataType.STRING, required: false, description: '消息 ID' }
  ],
  permissions: ['ohos.permission.SEND_MESSAGES'],
  requiresConfirmation: false,
  serviceAbilityName: 'SmsServiceAbility'
};

/**
 * 短信 AppServiceExtensionAbility
 */
export default class SmsServiceAbility extends AppServiceExtensionAbility {
  private provider: SmsAbilityProvider | null = null;

  onCreate(): void {
    logger.info(TAG, 'SmsServiceAbility onCreate');
    this.provider = new SmsAbilityProvider();
    void this.provider.initialize(this.context);
  }

  onDestroy(): void {
    logger.info(TAG, 'SmsServiceAbility onDestroy');
    this.provider?.dispose();
  }

  onConnect(want: Want): rpc.RemoteObject {
    logger.info(TAG, 'SmsServiceAbility onConnect');
    if (!this.provider) {
      this.provider = new SmsAbilityProvider();
      void this.provider.initialize(this.context);
    }
    return createProviderStub(this.provider);
  }

  async onStartCommand(want: Want, startId: number): Promise<void> {
    logger.info(TAG, `SmsServiceAbility onStartCommand, startId: ${startId}`);

    try {
      const phoneNumber = want.parameters?.['phoneNumber'] as string;
      const message = want.parameters?.['message'] as string;

      if (!phoneNumber || !message) {
        logger.error(TAG, 'Invalid parameters: missing phoneNumber or message');
        return;
      }

      const inputs: Record<string, Object> = {
        'phoneNumber': phoneNumber,
        'message': message
      };
      const result = await this.provider?.invoke(inputs);
      logger.info(TAG, `SMS send result: ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error(TAG, `Failed to handle SMS request: ${JSON.stringify(err)}`);
    }
  }
}

/**
 * SMS Ability Provider
 */
class SmsAbilityProvider extends AbilityLinkProvider {
  getCapability(): AbilityLinkCapability {
    return SMS_CAPABILITY;
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

    const phoneNumber = inputs['phoneNumber'] as string;
    const message = inputs['message'] as string;
    return this.sendSms(phoneNumber, message);
  }

  private async sendSms(phoneNumber: string, message: string): Promise<InvokeResult> {
    await this.delay(500);

    const messageId = `SMS_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    logger.info(TAG, `Mock SMS sent to ${phoneNumber}, messageId: ${messageId}`);

    return {
      success: true,
      outputs: {
        success: true,
        messageId: messageId
      },
      metadata: {
        provider: 'MockAbilityProvider',
        capability: 'sms.send'
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
