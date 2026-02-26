/**
 * AbilityLink Demo Page
 * Demonstrates capability registration and invocation
 */

import { promptAction } from '@kit.ArkUI';
import { AbilityLinkService, CapabilityInfo } from '../services/AbilityLinkService';
import { logger } from '../utils/Logger';

const TAG = 'AbilityLinkDemo';

@Entry
@Component
struct AbilityLinkDemo {
  @State capabilities: CapabilityInfo[] = [];
  @State isLoading: boolean = false;
  @State statusMessage: string = 'Waiting for provider registration via IPC';
  @State selectedCapability: CapabilityInfo | null = null;

  @State smsPhoneNumber: string = '';
  @State smsMessage: string = '';
  @State emailTo: string = '';
  @State emailSubject: string = '';
  @State emailBody: string = '';

  private abilityLinkService: AbilityLinkService = AbilityLinkService.getInstance();

  aboutToAppear(): void {
    logger.info(TAG, 'AbilityLinkDemo aboutToAppear');
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

  /**
   * Quick IPC ping using a mock SMS request.
   */
  async testIpc(): Promise<void> {
    const target = this.capabilities.find(cap => cap.capabilityName === 'sms.send')
      ?? this.capabilities[0];

    if (!target) {
      this.statusMessage = 'No capabilities registered yet';
      promptAction.showToast({ message: 'No capabilities registered yet' });
      return;
    }

    this.isLoading = true;
    this.statusMessage = `Testing IPC: ${target.displayName}`;

    try {
      const result = await this.abilityLinkService.invokeCapability(
        target.bundleName,
        target.capabilityName,
        target.capabilityName === 'sms.send'
          ? { "phoneNumber": "10086", "message": "IPC ping" }
          : {}
      );

      if (result.success) {
        this.statusMessage = `IPC test success (${target.capabilityName})`;
        promptAction.showToast({ message: 'IPC test success' });
      } else {
        this.statusMessage = `IPC test failed: ${result.error}`;
        promptAction.showToast({ message: `IPC test failed: ${result.error || 'unknown'}` });
      }
    } catch (err) {
      this.statusMessage = `IPC test error: ${JSON.stringify(err)}`;
      promptAction.showToast({ message: 'IPC test exception' });
      logger.error(TAG, `IPC test error: ${JSON.stringify(err)}`);
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

      // Refresh Button
      Row() {
        Button('Refresh List')
          .onClick(() => this.loadCapabilities())

        Button('Test IPC')
          .onClick(() => this.testIpc())
          .margin({ left: 10 })
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
