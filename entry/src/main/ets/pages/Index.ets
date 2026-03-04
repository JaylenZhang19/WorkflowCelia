/**
 * Workflow App Entry Point
 */
import router from '@ohos.router';

@Entry
@Component
struct Index {
  aboutToAppear() {
    // Navigate to chat page on load
    router.replaceUrl({
      url: 'pages/ChatPage'
    });
  }

  build() {
    Column() {
      Text('Loading Workflow...')
        .fontSize(18)
        .fontColor('#1C1C1E')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor('#F2F2F7')
  }
}
