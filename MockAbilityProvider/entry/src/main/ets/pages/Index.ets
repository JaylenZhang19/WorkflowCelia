/**
 * MockAbilityProvider Entry Page
 * Displays available capabilities and mock sending records
 */
import { logger } from '../utils/Logger';

const TAG = 'MockAbilityProvider';

@Entry
@Component
struct Index {
  @State message: string = 'Mock Ability Provider';

  aboutToAppear() {
    logger.info(TAG, 'MockAbilityProvider Index aboutToAppear');
  }

  build() {
    Scroll() {
      Column() {
        // Header
        Text('Mock Ability Provider')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .margin({ top: 20, bottom: 10 })

        Text('能力提供方服务')
          .fontSize(14)
          .fontColor('#666666')
          .margin({ bottom: 30 })

        // Capabilities Section
        Column() {
          Text('可用能力')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 15 })

          // SMS Capability
          Row() {
            Column() {
              Text('📱')
                .fontSize(32)
                .margin({ bottom: 5 })

              Text('短信能力')
                .fontSize(16)
                .fontWeight(FontWeight.Medium)

              Text('发送短信消息')
                .fontSize(12)
                .fontColor('#666666')
                .margin({ top: 5 })
            }
            .alignItems(HorizontalAlign.Center)

            Blank()

            Text('已启用')
              .fontSize(12)
              .fontColor('#07C160')
              .padding({ left: 5, right: 10, top: 5, bottom: 5 })
              .backgroundColor('rgba(7, 193, 96, 0.1)')
              .borderRadius(15)
          }
          .width('100%')
          .padding(15)
          .backgroundColor('#F5F5F5')
          .borderRadius(10)
          .margin({ bottom: 10 })

          // Email Capability
          Row() {
            Column() {
              Text('📧')
                .fontSize(32)
                .margin({ bottom: 5 })

              Text('邮件能力')
                .fontSize(16)
                .fontWeight(FontWeight.Medium)

              Text('发送邮件消息')
                .fontSize(12)
                .fontColor('#666666')
                .margin({ top: 5 })
            }
            .alignItems(HorizontalAlign.Center)

            Blank()

            Text('已启用')
              .fontSize(12)
              .fontColor('#07C160')
              .padding({ left: 5, right: 10, top: 5, bottom: 5 })
              .backgroundColor('rgba(7, 193, 96, 0.1)')
              .borderRadius(15)
          }
          .width('100%')
          .padding(15)
          .backgroundColor('#F5F5F5')
          .borderRadius(10)
          .margin({ bottom: 10 })
        }
        .width('100%')
        .padding(15)
        .backgroundColor('#FFFFFF')
        .borderRadius(10)
        .margin({ bottom: 15 })

        // Info Section
        Column() {
          Text('使用说明')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 10 })

          Text('1. 本应用提供短信和邮件发送能力的 Mock 实现')
            .fontSize(14)
            .fontColor('#333333')
            .margin({ bottom: 5 })
            .alignSelf(ItemAlign.Start)

          Text('2. WorkflowCelia 可通过 Want 调用本应用的 ExtensionAbility')
            .fontSize(14)
            .fontColor('#333333')
            .margin({ bottom: 5 })
            .alignSelf(ItemAlign.Start)

          Text('3. 调用时请指定正确的 bundleName 和 abilityName')
            .fontSize(14)
            .fontColor('#333333')
            .margin({ bottom: 5 })
            .alignSelf(ItemAlign.Start)

          Text('4. 所有发送记录将在后台模拟存储')
            .fontSize(14)
            .fontColor('#333333')
            .alignSelf(ItemAlign.Start)
        }
        .width('100%')
        .padding(15)
        .backgroundColor('#FFFFFF')
        .borderRadius(10)
        .margin({ bottom: 15 })

        // Technical Info
        Column() {
          Text('技术信息')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .alignSelf(ItemAlign.Start)
            .margin({ bottom: 10 })

          Column() {
            this.TechnicalInfoRow('Bundle', 'com.pumpkin.mockabilityprovider')
            this.TechnicalInfoRow('SMS Extension', 'SmsExtensionAbility')
            this.TechnicalInfoRow('Email Extension', 'EmailExtensionAbility')
            this.TechnicalInfoRow('Protocol Version', '1.0.0')
          }
          .width('100%')
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

  @Builder
  TechnicalInfoRow(label: string, value: string) {
    Row() {
      Text(label)
        .fontSize(14)
        .fontColor('#666666')
        .width(120)

      Text(value)
        .fontSize(14)
        .fontColor('#333333')
        .fontWeight(FontWeight.Medium)
    }
    .width('100%')
    .justifyContent(FlexAlign.Start)
    .padding({ top: 8, bottom: 8 })
  }
}
