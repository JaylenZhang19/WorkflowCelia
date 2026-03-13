import { logger } from '../utils/Logger';
import { testFunc } from '../entryability/EntryAbility';
import { LocalAgent } from '../agent/LocalAgent';
import { AgentStepEvent, AgentStepType } from '../agent/types';

const TAG: string = 'ChatPage';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'agent';
  timestamp: number;
  stepType?: AgentStepEvent;
}

@Entry
@Component
struct ChatPage {
  @State messages: Message[] = [];
  @State inputText: string = '';
  @State isSending: boolean = false;
  @State scrollToBottom: number = 0;
  private scroller: Scroller = new Scroller();
  private localAgent: LocalAgent = new LocalAgent(this.getUIContext().getHostContext()?.filesDir ?? '')

  aboutToAppear() {
    this.messages.push({
      id: this.generateId(),
      content: 'Hello! 我是 WorkflowCelia 原生 Agent，已直接连接 Core 层。',
      role: 'agent',
      timestamp: Date.now()
    });
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
  }

  sendMessage() {
    if (this.inputText.trim().length === 0 || this.isSending) {
      return;
    }

    const userMessage: Message = {
      id: this.generateId(),
      content: this.inputText.trim(),
      role: 'user',
      timestamp: Date.now()
    };

    this.messages.push(userMessage);
    const userInput = this.inputText.trim();
    this.inputText = '';
    this.isSending = true;
    this.processUserInput(userInput);
  }

  async processUserInput(input: string) {
    try {
      await this.localAgent.run(input, (step: AgentStepEvent) => {
        this.appendAgentStep(step);
      });
    } catch (error) {
      logger.error(TAG, `Failed to process input: ${JSON.stringify(error)}`);
      this.appendAgentStep({
        type: 'final',
        title: '错误',
        content: '抱歉，执行过程中出现了异常。',
        timestamp: Date.now()
      });
    } finally {
      this.isSending = false;
    }
  }

  private appendAgentStep(step: AgentStepEvent): void {
    this.messages.push({
      id: this.generateId(),
      content: `【${step.title}】\n${step.content}`,
      role: 'agent',
      timestamp: step.timestamp,
      stepType: step
    });
    this.scroller.scrollEdge(Edge.Bottom);
  }

  runTest() {
    logger.info(TAG, 'Test button clicked, running test function');
    testFunc().catch((error: Error) => {
      logger.error(TAG, `Test execution failed: ${JSON.stringify(error)}`);
    });
  }

  build() {
    Column() {
      Row() {
        Text('WorkflowCelia Agent')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1C1C1E')

        Blank()

        Button('Run Test')
          .fontSize(14)
          .fontColor('#FFFFFF')
          .backgroundColor('#007AFF')
          .borderRadius(8)
          .padding({ left: 12, right: 12, top: 6, bottom: 6 })
          .onClick(() => {
            this.runTest();
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .backgroundColor('#F2F2F7')

      Scroll(this.scroller) {
        Column() {
          ForEach(this.messages, (message: Message) => {
            this.MessageItem(message)
          }, (message: Message) => message.id)
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 8, bottom: 8 })
      }
      .layoutWeight(1)
      .width('100%')
      .scrollBar(BarState.Off)

      Row() {
        TextInput({ placeholder: 'Type a message...', text: this.inputText })
          .fontSize(16)
          .fontColor('#1C1C1E')
          .backgroundColor('#FFFFFF')
          .borderRadius(20)
          .padding({ left: 16, right: 16, top: 10, bottom: 10 })
          .layoutWeight(1)
          .onChange((value: string) => {
            this.inputText = value;
          })

        Button() {
          Image($r('sys.media.AI_phone'))
            .width(24)
            .height(24)
            .fillColor('#FFFFFF')
        }
        .width(44)
        .height(44)
        .borderRadius(22)
        .backgroundColor(this.inputText.trim().length > 0 ? '#007AFF' : '#C7C7CC')
        .enabled(this.inputText.trim().length > 0 && !this.isSending)
        .margin({ left: 8 })
        .onClick(() => {
          this.sendMessage();
        })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 12, bottom: 12 })
      .backgroundColor('#F2F2F7')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#FFFFFF')
  }

  @Builder
  MessageItem(message: Message) {
    Row() {
      if (message.role === 'user') {
        Blank()
        this.MessageBubble(message, '#007AFF', '#FFFFFF')
      } else {
        this.MessageBubble(message, '#E5E5EA', '#1C1C1E')
        Blank()
      }
    }
    .width('100%')
    .margin({ top: 4, bottom: 4 })
  }

  @Builder
  MessageBubble(message: Message, bgColor: string, textColor: string) {
    Column() {
      if (message.role === 'agent' && message.stepType) {
        Text(this.getStepTitle(message.stepType.type))
          .fontSize(11)
          .fontColor('#4A4A4A')
          .fontWeight(FontWeight.Medium)
          .backgroundColor('#D1D1D6')
          .padding({ left: 8, right: 8, top: 2, bottom: 2 })
          .borderRadius(8)
          .margin({ bottom: 6 })
      }

      Text(message.content)
        .fontSize(16)
        .fontColor(textColor)

      Text(this.formatTime(message.timestamp))
        .fontSize(12)
        .fontColor('#8E8E93')
        .margin({ top: 4 })
    }
    .padding({ left: 12, right: 12, top: 8, bottom: 8 })
    .backgroundColor(bgColor)
    .borderRadius(16)
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getStepTitle(stepType: AgentStepType): string {
    if (stepType === 'thought') {
      return 'THOUGHT';
    }
    if (stepType === 'skill') {
      return 'SKILL';
    }
    if (stepType === 'action') {
      return 'ACTION';
    }
    if (stepType === 'observation') {
      return 'OBSERVATION';
    }
    return 'FINAL';
  }
}
