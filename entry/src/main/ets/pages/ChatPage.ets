import router from '@ohos.router';
import { logger } from '../utils/Logger';
import { GeneralAbilityManager } from '../abilityprovider/GeneralAbilityManager';
import { QueryMessage, InvokeResult } from '../abilityprovider/AbilityTypes';
import { testFunc } from '../entryability/EntryAbility';

const TAG: string = 'ChatPage';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'agent';
  timestamp: number;
}

@Entry
@Component
struct ChatPage {
  @State messages: Message[] = [];
  @State inputText: string = '';
  @State isSending: boolean = false;
  @State scrollToBottom: number = 0;
  private scroller: Scroller = new Scroller();

  aboutToAppear() {
    // Add welcome message
    this.messages.push({
      id: this.generateId(),
      content: 'Hello! I am WorkflowCelia Agent. How can I help you today?',
      role: 'agent',
      timestamp: Date.now()
    });
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
    const userInput = this.inputText;
    this.inputText = '';
    this.isSending = true;
    this.scrollToBottom++;

    // Process user input and get agent response
    this.processUserInput(userInput);
  }

  async processUserInput(input: string) {
    try {
      // TODO: Integrate with Agent logic in the future
      // For now, use a simple rule-based response
      const response = await this.getAgentResponse(input);
      
      const agentMessage: Message = {
        id: this.generateId(),
        content: response,
        role: 'agent',
        timestamp: Date.now()
      };
      
      this.messages.push(agentMessage);
      this.scrollToBottom++;
    } catch (error) {
      logger.error(TAG, `Failed to process input: ${JSON.stringify(error)}`);
      const errorMessage: Message = {
        id: this.generateId(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'agent',
        timestamp: Date.now()
      };
      this.messages.push(errorMessage);
      this.scrollToBottom++;
    } finally {
      this.isSending = false;
    }
  }

  async getAgentResponse(input: string): Promise<string> {
    // Simple rule-based responses for demo
    // TODO: Replace with actual Agent inference logic
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('calendar') || lowerInput.includes('schedule')) {
      return 'I can help you manage your calendar. You can ask me to add, delete, or query calendar events.';
    } else if (lowerInput.includes('contact')) {
      return 'I can help you manage contacts. You can ask me to add, update, or query contact information.';
    } else if (lowerInput.includes('file') || lowerInput.includes('document')) {
      return 'I can help you manage files. You can ask me to read, write, copy, move, or delete files.';
    } else if (lowerInput.includes('email') || lowerInput.includes('mail')) {
      return 'I can help you send emails. Just provide the recipient and content.';
    } else if (lowerInput.includes('sms') || lowerInput.includes('message') || lowerInput.includes('text')) {
      return 'I can help you send SMS messages. Just provide the phone number and message content.';
    } else if (lowerInput.includes('camera') || lowerInput.includes('photo')) {
      return 'I can help you take photos. You can use the camera function to capture images.';
    } else if (lowerInput.includes('call') || lowerInput.includes('phone')) {
      return 'I can help you make phone calls. Just provide the phone number.';
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return 'Hello! How can I assist you today?';
    } else {
      return `I received your message: "${input}". I'm currently in demo mode. Full Agent inference logic will be integrated soon.`;
    }
  }

  runTest() {
    logger.info(TAG, 'Test button clicked, running test function');
    // Call the exported test function from EntryAbility
    testFunc().catch((error: Error) => {
      logger.error(TAG, `Test execution failed: ${JSON.stringify(error)}`);
    });
  }

  build() {
    Column() {
      // Header
      Row() {
        Text('WorkflowCelia Agent')
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1C1C1E')
        
        Blank()
        
        // Test Button
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

      // Message List
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


      // Input Area
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
        this.MessageBubble(message, '#007AFF', '#FFFFFF', Alignment.End)
      } else {
        this.MessageBubble(message, '#E5E5EA', '#1C1C1E', Alignment.Start)
        Blank()
      }
    }
    .width('100%')
    .margin({ top: 4, bottom: 4 })
  }

  @Builder
  MessageBubble(message: Message, bgColor: string, textColor: string, alignment: Alignment) {
    Column() {
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
}
