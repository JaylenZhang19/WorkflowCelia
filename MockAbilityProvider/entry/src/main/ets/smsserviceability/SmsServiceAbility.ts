import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x1000;
const TAG = 'SmsServiceExtension';

/**
 * 短信发送参数接口
 */
interface SmsSendParams {
  phoneNumber: string;      // 接收方电话号码
  message: string;          // 短信内容
}

/**
 * 短信发送结果接口
 */
interface SmsSendResult {
  success: boolean;         // 是否发送成功
  messageId?: string;       // 消息 ID（成功时返回）
  errorCode?: number;       // 错误码（失败时返回）
  errorMessage?: string;    // 错误信息（失败时返回）
}

/**
 * 短信 AppServiceExtensionAbility
 * 用于处理短信发送请求，供 WorkflowCelia 后台调用
 */
export default class SmsServiceAbility extends AppServiceExtensionAbility {
  private static readonly SMS_SERVICE_ACTION = 'action.send.sms';

  onCreate(): void {
    hilog.info(DOMAIN, TAG, 'SmsServiceExtension onCreate');
  }

  onDestroy(): void {
    hilog.info(DOMAIN, TAG, 'SmsServiceExtension onDestroy');
  }

  /**
   * 处理 Want 请求
   * @param want 调用请求
   * @param startId 启动 ID
   */
  async onStartCommand(want: Want, startId: number): Promise<void> {
    hilog.info(DOMAIN, TAG, 'SmsServiceExtension onStartCommand, want: %{public}s, startId: %{public}d', 
      JSON.stringify(want), startId);

    try {
      const params = want.parameters as unknown as SmsSendParams;
      if (!params?.phoneNumber || !params?.message) {
        hilog.error(DOMAIN, TAG, 'Invalid parameters: missing phoneNumber or message');
        return;
      }

      const result = await this.sendSms(params);
      hilog.info(DOMAIN, TAG, 'SMS send result: %{public}s', JSON.stringify(result));
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to handle SMS request: %{public}s', JSON.stringify(err));
    }
  }

  /**
   * 模拟发送短信
   * 实际场景中应调用系统短信 API
   * @param params 短信参数
   * @returns 发送结果
   */
  private async sendSms(params: SmsSendParams): Promise<SmsSendResult> {
    // 模拟短信发送延迟
    await this.delay(500);

    // 模拟短信发送逻辑（当前为 Mock 实现）
    const mockSuccess = true;

    if (mockSuccess) {
      const messageId = `SMS_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      hilog.info(DOMAIN, TAG, 'Mock SMS sent to %{public}s, content: %{public}s, messageId: %{public}s',
        params.phoneNumber, params.message, messageId);

      // 存储发送记录到本地（可选）
      this.saveSmsRecord(params, messageId);

      return {
        success: true,
        messageId: messageId
      };
    } else {
      return {
        success: false,
        errorCode: 1001,
        errorMessage: 'Mock SMS send failed'
      };
    }
  }

  /**
   * 保存短信发送记录
   */
  private saveSmsRecord(params: SmsSendParams, messageId: string): void {
    try {
      const record = {
        messageId,
        phoneNumber: params.phoneNumber,
        message: params.message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      hilog.info(DOMAIN, TAG, 'SMS record saved: %{public}s', JSON.stringify(record));
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to save SMS record: %{public}s', JSON.stringify(err));
    }
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
      }, ms);
      void timer;
    });
  }
}
