/**
 * Demo Page - External Ability Invocation
 * Demonstrates how to invoke SMS and Email capabilities from MockAbilityProvider
 */
import { ExternalAbilityService, SmsParams, EmailParams } from '../providers/ExternalAbilityService';
import { BackgroundTaskExecutor, TaskType, TaskDefinition } from '../core/engine/BackgroundTaskExecutor';
import { promptAction } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';

const DOMAIN = 0x3000;
const TAG = 'ExternalAbilityDemo';

@Entry
@Component
struct ExternalAbilityDemo {
  private abilityService: ExternalAbilityService = ExternalAbilityService.getInstance();
  private taskExecutor: BackgroundTaskExecutor = BackgroundTaskExecutor.getInstance();
  
  // SMS form state
  @State phoneNumber: string = '';
  @State smsMessage: string = '';
  @State smsResult: string = '';
  
  // Email form state
  @State emailTo: string = '';
  @State emailSubject: string = '';
  @State emailBody: string = '';
  @State emailResult: string = '';
  
  // Task queue state
  @State taskCount: number = 0;
  @State tasks: TaskDefinition[] = [];

  aboutToAppear() {
    hilog.info(DOMAIN, TAG, 'ExternalAbilityDemo aboutToAppear');
  }

  async aboutToDisappear() {
    this.abilityService.dispose();
    this.taskExecutor.dispose();
  }

  /**
   * Send SMS via ExternalAbilityService
   */
  async sendSms(): Promise<void> {
    if (!this.phoneNumber || !this.smsMessage) {
      promptAction.showToast({ message: '请填写电话号码和短信内容' });
      return;
    }

    try {
      const params: SmsParams = {
        phoneNumber: this.phoneNumber,
        message: this.smsMessage
      };

      const result = await this.abilityService.sendSms(params);
      
      if (result.success) {
        this.smsResult = `发送成功！消息 ID: ${result.messageId}`;
        promptAction.showToast({ message: '短信发送成功' });
      } else {
        this.smsResult = `发送失败：${result.error}`;
        promptAction.showToast({ message: `短信发送失败：${result.error}` });
      }
    } catch (err) {
      this.smsResult = `异常：${JSON.stringify(err)}`;
      promptAction.showToast({ message: '短信发送异常' });
    }
  }

  /**
   * Send Email via ExternalAbilityService
   */
  async sendEmail(): Promise<void> {
    if (!this.emailTo || !this.emailSubject || !this.emailBody) {
      promptAction.showToast({ message: '请填写收件人、主题和正文' });
      return;
    }

    try {
      const params: EmailParams = {
        to: this.emailTo.split(',').map(e => e.trim()),
        subject: this.emailSubject,
        body: this.emailBody
      };

      const result = await this.abilityService.sendEmail(params);
      
      if (result.success) {
        this.emailResult = `发送成功！消息 ID: ${result.messageId}`;
        promptAction.showToast({ message: '邮件发送成功' });
      } else {
        this.emailResult = `发送失败：${result.error}`;
        promptAction.showToast({ message: `邮件发送失败：${result.error}` });
      }
    } catch (err) {
      this.emailResult = `异常：${JSON.stringify(err)}`;
      promptAction.showToast({ message: '邮件发送异常' });
    }
  }

  /**
   * Add SMS task to background queue
   */
  addSmsTask(): void {
    if (!this.phoneNumber || !this.smsMessage) {
      promptAction.showToast({ message: '请填写电话号码和短信内容' });
      return;
    }

    this.taskExecutor.addTask({
      type: TaskType.SEND_SMS,
      name: '发送短信',
      description: `向 ${this.phoneNumber} 发送短信`,
      inputs: {
        phoneNumber: this.phoneNumber,
        message: this.smsMessage
      }
    });

    this.updateTaskList();
    promptAction.showToast({ message: '短信任务已添加到队列' });
  }

  /**
   * Add Email task to background queue
   */
  addEmailTask(): void {
    if (!this.emailTo || !this.emailSubject || !this.emailBody) {
      promptAction.showToast({ message: '请填写收件人、主题和正文' });
      return;
    }

    this.taskExecutor.addTask({
      type: TaskType.SEND_EMAIL,
      name: '发送邮件',
      description: `向 ${this.emailTo} 发送邮件`,
      inputs: {
        to: this.emailTo.split(',').map(e => e.trim()),
        subject: this.emailSubject,
        body: this.emailBody
      }
    });

    this.updateTaskList();
    promptAction.showToast({ message: '邮件任务已添加到队列' });
  }

  /**
   * Update task list from executor
   */
  updateTaskList(): void {
    this.tasks = this.taskExecutor.getAllTasks();
    this.taskCount = this.taskExecutor.getQueueLength();
  }

  build() {
    Scroll() {
      Column() {
        // Title
        Text('外部能力调用演示')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .margin({ top: 20, bottom: 10 })

        Text('MockAbilityProvider 集成测试')
          .fontSize(14)
          .fontColor('#666666')
          .margin({ bottom: 20 })

        // SMS Section
        Column() {
          Text('短信发送')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 10 })

          TextInput({ placeholder: '请输入电话号码', text: this.phoneNumber })
            .onChange((value: string) => {
              this.phoneNumber = value;
            })
            .width('100%')
            .margin({ bottom: 10 })

          TextArea({ placeholder: '请输入短信内容', text: this.smsMessage })
            .onChange((value: string) => {
              this.smsMessage = value;
            })
            .width('100%')
            .height(100)
            .margin({ bottom: 10 })

          Row() {
            Button('立即发送')
              .onClick(() => this.sendSms())
              .margin({ right: 10 })

            Button('加入任务队列')
              .type(ButtonType.Normal)
              .onClick(() => this.addSmsTask())
          }
          .width('100%')
          .justifyContent(FlexAlign.Start)

          if (this.smsResult) {
            Text(this.smsResult)
              .fontSize(12)
              .fontColor(this.smsResult.includes('成功') ? '#07C160' : '#FA5151')
              .margin({ top: 10 })
              .alignSelf(ItemAlign.Start)
          }
        }
        .width('100%')
        .padding(15)
        .backgroundColor('#FFFFFF')
        .borderRadius(10)
        .margin({ bottom: 15 })

        // Email Section
        Column() {
          Text('邮件发送')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 10 })

          TextInput({ placeholder: '请输入收件人邮箱（多个用逗号分隔）', text: this.emailTo })
            .onChange((value: string) => {
              this.emailTo = value;
            })
            .width('100%')
            .margin({ bottom: 10 })

          TextInput({ placeholder: '请输入邮件主题', text: this.emailSubject })
            .onChange((value: string) => {
              this.emailSubject = value;
            })
            .width('100%')
            .margin({ bottom: 10 })

          TextArea({ placeholder: '请输入邮件正文', text: this.emailBody })
            .onChange((value: string) => {
              this.emailBody = value;
            })
            .width('100%')
            .height(100)
            .margin({ bottom: 10 })

          Row() {
            Button('立即发送')
              .onClick(() => this.sendEmail())
              .margin({ right: 10 })

            Button('加入任务队列')
              .type(ButtonType.Normal)
              .onClick(() => this.addEmailTask())
          }
          .width('100%')
          .justifyContent(FlexAlign.Start)

          if (this.emailResult) {
            Text(this.emailResult)
              .fontSize(12)
              .fontColor(this.emailResult.includes('成功') ? '#07C160' : '#FA5151')
              .margin({ top: 10 })
              .alignSelf(ItemAlign.Start)
          }
        }
        .width('100%')
        .padding(15)
        .backgroundColor('#FFFFFF')
        .borderRadius(10)
        .margin({ bottom: 15 })

        // Task Queue Section
        Column() {
          Text(`任务队列 (${this.taskCount})`)
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 10 })

          if (this.tasks.length === 0) {
            Text('暂无任务')
              .fontSize(14)
              .fontColor('#999999')
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(20)
          } else {
            ForEach(this.tasks.slice(-5), (task: TaskDefinition) => {
              Column() {
                Row() {
                  Text(task.name)
                    .fontSize(14)
                    .fontWeight(FontWeight.Medium)

                  Blank()

                  Text(this.getTaskStatusText(task.status))
                    .fontSize(12)
                    .fontColor(this.getTaskStatusColor(task.status))
                }
                .width('100%')

                Text(task.description || '')
                  .fontSize(12)
                  .fontColor('#666666')
                  .margin({ top: 5 })
                  .alignSelf(ItemAlign.Start)
              }
              .width('100%')
              .padding(10)
              .backgroundColor('#F5F5F5')
              .borderRadius(5)
              .margin({ bottom: 5 })
            })
          }
        }
        .width('100%')
        .padding(15)
        .backgroundColor('#FFFFFF')
        .borderRadius(10)
      }
      .width('100%')
      .padding(15)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F2F2F7')
  }

  getTaskStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '等待中',
      'running': '执行中',
      'completed': '已完成',
      'failed': '失败',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  getTaskStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending': '#999999',
      'running': '#1890FF',
      'completed': '#07C160',
      'failed': '#FA5151',
      'cancelled': '#999999'
    };
    return colorMap[status] || '#666666';
  }
}
