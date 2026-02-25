/**
 * AbilityLink Demo Page
 * Demonstrates capability registration and invocation
 */

import { hilog } from '@kit.PerformanceAnalysisKit';
import { AbilityLinkService, CapabilityInfo } from '../services/AbilityLinkService';
import { InvokeResult, RegistrationInfo, AbilityCategory, AbilityLinkCapability,
  CapabilityDataType } from 'ability_link';

const DOMAIN = 0x2100;
const TAG = 'AbilityLinkDemo';

@Entry
@Component
struct AbilityLinkDemo {
  @State capabilities: CapabilityInfo[] = [];
  @State isLoading: boolean = false;
  @State statusMessage: string = 'Register capabilities to get started';
  @State selectedCapability: CapabilityInfo | null = null;

  @State smsPhoneNumber: string = '';
  @State smsMessage: string = '';
  @State emailTo: string = '';
  @State emailSubject: string = '';
  @State emailBody: string = '';

  private abilityLinkService: AbilityLinkService = AbilityLinkService.getInstance();

  aboutToAppear(): void {
    hilog.info(DOMAIN, TAG, 'AbilityLinkDemo aboutToAppear');
    // Load registered capabilities
    this.loadCapabilities();
  }

  aboutToDisappear(): void {
    this.selectedCapability = null;
  }

  /**
   * Load registered capabilities
   */
  loadCapabilities(): void {
    this.capabilities = this.abilityLinkService.getAllCapabilities();
    this.statusMessage = this.capabilities.length > 0
      ? `Found ${this.capabilities.length} registered capabilities`
      : 'No capabilities registered yet';
  }

  /**
   * Register MockAbilityProvider capabilities (demo)
   */
  registerMockProvider(): void {
    const registration: RegistrationInfo = {
      bundleName: 'com.pumpkin.mockabilityprovider',
      bundleDisplayName: 'MockAbility Provider',
      capabilities: [
        {
          name: 'sms.send',
          displayName: '发送短信',
          description: '通过 MockAbilityProvider 发送短信',
          version: '1.0.0',
          category: AbilityCategory.COMMUNICATION,
          inputs: [
            { name: 'phoneNumber', type: CapabilityDataType.STRING, required: true, description: '电话号码' },
            { name: 'message', type: CapabilityDataType.STRING, required: true, description: '短信内容' }
          ],
          outputs: [
            { name: 'success', type: CapabilityDataType.BOOLEAN, required: true, description: '是否成功' },
            { name: 'messageId', type: CapabilityDataType.STRING, required: false, description: '消息 ID' }
          ],
          permissions: ['ohos.permission.SEND_MESSAGES'],
          requiresConfirmation: false
        },
        {
          name: 'email.send',
          displayName: '发送邮件',
          description: '通过 MockAbilityProvider 发送邮件',
          version: '1.0.0',
          category: AbilityCategory.COMMUNICATION,
          inputs: [
            { name: 'to', type: CapabilityDataType.ARRAY, required: true, description: '收件人列表' },
            { name: 'subject', type: CapabilityDataType.STRING, required: true, description: '主题' },
            { name: 'body', type: CapabilityDataType.STRING, required: true, description: '正文' }
          ],
          outputs: [
            { name: 'success', type: CapabilityDataType.BOOLEAN, required: true, description: '是否成功' },
            { name: 'messageId', type: CapabilityDataType.STRING, required: false, description: '消息 ID' }
          ],
          permissions: ['ohos.permission.INTERNET'],
          requiresConfirmation: false
        }
      ]
    };

    this.abilityLinkService.registerCapabilities(registration);
    this.loadCapabilities();
    this.statusMessage = 'MockAbilityProvider registered successfully';
  }

  /**
   * Unregister MockAbilityProvider capabilities (demo)
   */
  unregisterMockProvider(): void {
    this.abilityLinkService.unregisterCapabilities('com.pumpkin.mockabilityprovider');
    this.loadCapabilities();
    this.statusMessage = 'MockAbilityProvider unregistered';
    this.selectedCapability = null;
  }

  /**
   * Select a capability
   */
  selectCapability(capability: CapabilityInfo): void {
    this.selectedCapability = capability;
    this.statusMessage = `Selected: ${capability.displayName}`;
  }

  /**
   * Send SMS via selected capability
   */
  async sendSms(): Promise<void> {
    if (!this.selectedCapability) {
      this.statusMessage = 'Please select a capability first';
      return;
    }

    if (!this.smsPhoneNumber || !this.smsMessage) {
      this.statusMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Sending SMS...';

    try {
      const result = await this.abilityLinkService.invokeCapability(
        this.selectedCapability.bundleName,
        this.selectedCapability.capabilityName,
        {
          "phoneNumber": this.smsPhoneNumber,
          "message": this.smsMessage
        }
      );

      if (result.success) {
        this.statusMessage = `SMS sent successfully! ID: ${result.outputs?.messageId || 'N/A'}`;
      } else {
        this.statusMessage = `SMS failed: ${result.error}`;
      }
    } catch (err) {
      this.statusMessage = `SMS error: ${JSON.stringify(err)}`;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Send Email via selected capability
   */
  async sendEmail(): Promise<void> {
    if (!this.selectedCapability) {
      this.statusMessage = 'Please select a capability first';
      return;
    }

    if (!this.emailTo || !this.emailSubject) {
      this.statusMessage = 'Please fill in required fields';
      return;
    }

    this.isLoading = true;
    this.statusMessage = 'Sending Email...';

    try {
      const result = await this.abilityLinkService.invokeCapability(
        this.selectedCapability.bundleName,
        this.selectedCapability.capabilityName,
        {
          "to": [this.emailTo],
          "subject": this.emailSubject,
          "body": this.emailBody
        }
      );

      if (result.success) {
        this.statusMessage = `Email sent successfully! ID: ${result.outputs?.messageId || 'N/A'}`;
      } else {
        this.statusMessage = `Email failed: ${result.error}`;
      }
    } catch (err) {
      this.statusMessage = `Email error: ${JSON.stringify(err)}`;
    } finally {
      this.isLoading = false;
    }
  }

  build() {
    Column() {
      // Header
      Row() {
        Text('AbilityLink Demo')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
      }
      .width('100%')
      .padding(16)
      .backgroundColor('#007DFF')

      // Status
      Row() {
        Text(this.statusMessage)
          .fontSize(14)
          .fontColor('#666666')
      }
      .width('100%')
      .padding(12)
      .backgroundColor('#F5F5F5')

      // Registration Buttons
      Row() {
        Button('Register Mock Provider')
          .onClick(() => this.registerMockProvider())

        Button('Unregister')
          .onClick(() => this.unregisterMockProvider())
          .margin({ left: 10 })
      }
      .width('100%')
      .padding(16)
      .justifyContent(FlexAlign.Center)

      // Refresh Button
      Row() {
        Button('Refresh List')
          .onClick(() => this.loadCapabilities())
      }
      .width('100%')
      .padding(16)
      .justifyContent(FlexAlign.Center)

      // Capabilities List
      if (this.capabilities.length > 0) {
        List() {
          ForEach(this.capabilities, (capability: CapabilityInfo) => {
            ListItem() {
              Row() {
                Column() {
                  Text(capability.displayName)
                    .fontSize(16)
                    .fontWeight(FontWeight.Medium)

                  Text(`${capability.bundleDisplayName} - ${capability.description}`)
                    .fontSize(12)
                    .fontColor('#666666')
                    .margin({ top: 4 })
                }
                .alignItems(HorizontalAlign.Start)

                Blank()

                Button('Select')
                  .onClick(() => this.selectCapability(capability))
              }
              .width('100%')
              .padding(16)
            }
          })
        }
        .layoutWeight(1)
        .width('100%')
      }

      // Selected Capability Actions
      if (this.selectedCapability) {
        Column() {
          Text(`Selected: ${this.selectedCapability.displayName}`)
            .fontSize(16)
            .fontWeight(FontWeight.Medium)
            .margin({ bottom: 16 })

          // SMS Input (if SMS capability)
          if (this.selectedCapability.capabilityName === 'sms.send') {
            Column() {
              TextInput({ placeholder: 'Phone Number' })
                .onChange((value: string) => this.smsPhoneNumber = value)
                .width('100%')
                .margin({ bottom: 10 })

              TextInput({ placeholder: 'Message' })
                .onChange((value: string) => this.smsMessage = value)
                .width('100%')
                .margin({ bottom: 10 })

              Button('Send SMS')
                .onClick(() => this.sendSms())
                .width('100%')
            }
            .padding(16)
            .backgroundColor('#F5F5F5')
          }

          // Email Input (if Email capability)
          if (this.selectedCapability.capabilityName === 'email.send') {
            Column() {
              TextInput({ placeholder: 'To (email address)' })
                .onChange((value: string) => this.emailTo = value)
                .width('100%')
                .margin({ bottom: 10 })

              TextInput({ placeholder: 'Subject' })
                .onChange((value: string) => this.emailSubject = value)
                .width('100%')
                .margin({ bottom: 10 })

              TextArea({ placeholder: 'Message' })
                .onChange((value: string) => this.emailBody = value)
                .width('100%')
                .height(100)
                .margin({ bottom: 10 })

              Button('Send Email')
                .onClick(() => this.sendEmail())
                .width('100%')
            }
            .padding(16)
            .backgroundColor('#F5F5F5')
          }
        }
        .width('100%')
        .padding(16)
      }

      // Loading indicator
      if (this.isLoading) {
        LoadingProgress()
          .margin({ top: 20 })
      }
    }
    .width('100%')
    .height('100%')
  }
}
