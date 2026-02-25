import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x1001;
const TAG = 'EmailServiceExtension';

/**
 * 邮件附件接口
 */
interface EmailAttachment {
  fileName: string;       // 文件名
  filePath?: string;      // 文件路径（可选）
  mimeType?: string;      // MIME 类型（可选）
}

/**
 * 邮件发送参数接口
 */
interface EmailSendParams {
  to: string[];           // 收件人列表
  cc?: string[];          // 抄送人列表（可选）
  bcc?: string[];         // 密送人列表（可选）
  subject: string;        // 邮件主题
  body: string;           // 邮件正文
  isHtml?: boolean;       // 是否为 HTML 格式（可选，默认 false）
  attachments?: EmailAttachment[]; // 附件列表（可选）
}

/**
 * 邮件发送结果接口
 */
interface EmailSendResult {
  success: boolean;         // 是否发送成功
  messageId?: string;       // 消息 ID（成功时返回）
  errorCode?: number;       // 错误码（失败时返回）
  errorMessage?: string;    // 错误信息（失败时返回）
}

/**
 * 邮件 AppServiceExtensionAbility
 * 用于处理邮件发送请求，供 WorkflowCelia 后台调用
 */
export default class EmailServiceAbility extends AppServiceExtensionAbility {
  private static readonly EMAIL_SERVICE_ACTION = 'action.send.email';

  onCreate(): void {
    hilog.info(DOMAIN, TAG, 'EmailServiceExtension onCreate');
  }

  onDestroy(): void {
    hilog.info(DOMAIN, TAG, 'EmailServiceExtension onDestroy');
  }

  /**
   * 处理 Want 请求
   * @param want 调用请求
   * @param startId 启动 ID
   */
  async onStartCommand(want: Want, startId: number): Promise<void> {
    hilog.info(DOMAIN, TAG, 'EmailServiceExtension onStartCommand, want: %{public}s, startId: %{public}d', 
      JSON.stringify(want), startId);

    try {
      const params = want.parameters as unknown as EmailSendParams;
      if (!params?.to || params.to.length === 0 || !params?.subject) {
        hilog.error(DOMAIN, TAG, 'Invalid parameters: missing recipients or subject');
        return;
      }

      const result = await this.sendEmail(params);
      hilog.info(DOMAIN, TAG, 'Email send result: %{public}s', JSON.stringify(result));
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to handle email request: %{public}s', JSON.stringify(err));
    }
  }

  /**
   * 模拟发送邮件
   * 实际场景中应调用 SMTP 或系统邮件 API
   * @param params 邮件参数
   * @returns 发送结果
   */
  private async sendEmail(params: EmailSendParams): Promise<EmailSendResult> {
    // 模拟邮件发送延迟
    await this.delay(800);

    // 模拟邮件发送逻辑（当前为 Mock 实现）
    const mockSuccess = true;

    if (mockSuccess) {
      const messageId = `EMAIL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      hilog.info(DOMAIN, TAG, 'Mock Email sent to %{public}s, subject: %{public}s, messageId: %{public}s',
        JSON.stringify(params.to), params.subject, messageId);

      // 存储发送记录到本地（可选）
      this.saveEmailRecord(params, messageId);

      return {
        success: true,
        messageId: messageId
      };
    } else {
      return {
        success: false,
        errorCode: 2001,
        errorMessage: 'Mock email send failed'
      };
    }
  }

  /**
   * 保存邮件发送记录
   */
  private saveEmailRecord(params: EmailSendParams, messageId: string): void {
    try {
      const record = {
        messageId,
        recipients: params.to,
        cc: params.cc || [],
        subject: params.subject,
        body: params.body,
        isHtml: params.isHtml || false,
        attachmentCount: params.attachments?.length || 0,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      hilog.info(DOMAIN, TAG, 'Email record saved: %{public}s', JSON.stringify(record));
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to save email record: %{public}s', JSON.stringify(err));
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
