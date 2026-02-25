import { hilog } from '@kit.PerformanceAnalysisKit';
import { common } from '@kit.AbilityKit';
import { MockSmsAbilityProvider } from './MockSmsAbilityProvider';
import { MockEmailAbilityProvider } from './MockEmailAbilityProvider';
import { IAbilityProvider, AbilityResult } from '../abilities/IAbilityProvider';

const DOMAIN = 0x2100;
const TAG = 'ExternalAbilityService';

/**
 * SMS 发送参数
 */
export interface SmsParams {
  phoneNumber: string;
  message: string;
}

/**
 * 邮件发送参数
 */
export interface EmailParams {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  isHtml?: boolean;
}

/**
 * 能力调用结果
 */
export interface AbilityCallResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * 外部能力服务
 * 统一管理对外部能力提供方（MockAbilityProvider）的调用
 */
export class ExternalAbilityService {
  private static instance: ExternalAbilityService;
  private context: common.UIAbilityContext | null = null;
  private smsProvider: MockSmsAbilityProvider;
  private emailProvider: MockEmailAbilityProvider;

  private constructor() {
    this.smsProvider = new MockSmsAbilityProvider();
    this.emailProvider = new MockEmailAbilityProvider();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ExternalAbilityService {
    if (!ExternalAbilityService.instance) {
      ExternalAbilityService.instance = new ExternalAbilityService();
    }
    return ExternalAbilityService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(context: common.UIAbilityContext): Promise<void> {
    this.context = context;
    this.smsProvider.setContext(context);
    this.emailProvider.setContext(context);

    await this.smsProvider.initialize();
    await this.emailProvider.initialize();

    hilog.info(DOMAIN, TAG, 'ExternalAbilityService initialized');
  }

  /**
   * 发送短信
   * @param params 短信参数
   * @returns 调用结果
   */
  async sendSms(params: SmsParams): Promise<AbilityCallResult> {
    hilog.info(DOMAIN, TAG, 'Sending SMS to %{public}s', params.phoneNumber);

    try {
      const abilityContext = this.createAbilityContext();
      const result = await this.smsProvider.execute(
        { phoneNumber: params.phoneNumber, message: params.message },
        abilityContext
      );

      return {
        success: result.success,
        messageId: result.outputs?.messageId,
        error: result.error,
        errorCode: result.errorCode
      };
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to send SMS: %{public}s', JSON.stringify(err));
      return {
        success: false,
        error: `SMS send failed: ${JSON.stringify(err)}`,
        errorCode: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * 发送邮件
   * @param params 邮件参数
   * @returns 调用结果
   */
  async sendEmail(params: EmailParams): Promise<AbilityCallResult> {
    hilog.info(DOMAIN, TAG, 'Sending Email to %{public}s', JSON.stringify(params.to));

    try {
      const abilityContext = this.createAbilityContext();
      const result = await this.emailProvider.execute(
        {
          to: params.to,
          subject: params.subject,
          body: params.body,
          cc: params.cc,
          bcc: params.bcc,
          isHtml: params.isHtml
        },
        abilityContext
      );

      return {
        success: result.success,
        messageId: result.outputs?.messageId,
        error: result.error,
        errorCode: result.errorCode
      };
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to send Email: %{public}s', JSON.stringify(err));
      return {
        success: false,
        error: `Email send failed: ${JSON.stringify(err)}`,
        errorCode: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * 检查能力是否可用
   */
  async checkAvailability(): Promise<{ sms: boolean; email: boolean }> {
    const smsAvailable = await this.smsProvider.isAvailable();
    const emailAvailable = await this.emailProvider.isAvailable();

    return {
      sms: smsAvailable,
      email: emailAvailable
    };
  }

  /**
   * 获取能力提供者列表
   */
  getProviders(): IAbilityProvider[] {
    return [this.smsProvider, this.emailProvider];
  }

  /**
   * 创建能力执行上下文
   */
  private createAbilityContext() {
    return {
      getVariable: (name: string): any => {
        // Implement variable storage if needed
        return null;
      },
      setVariable: (name: string, value: any, dataType: string): void => {
        // Implement variable storage if needed
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void => {
        const logLevel = { debug: 0, info: 1, warn: 2, error: 3 }[level];
        hilog.info(DOMAIN, TAG, '[%{public}s] %{public}s', level.toUpperCase(), message);
        if (data) {
          hilog.info(DOMAIN, TAG, 'Data: %{public}s', JSON.stringify(data));
        }
      },
      isCancelled: (): boolean => false,
      requestConfirmation: async (message: string): Promise<boolean> => true
    };
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.smsProvider.dispose();
    this.emailProvider.dispose();
    this.context = null;
    hilog.info(DOMAIN, TAG, 'ExternalAbilityService disposed');
  }
}
