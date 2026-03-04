import { logger } from '../utils/Logger';
import { GeneralAbilityManager } from '../abilityprovider/GeneralAbilityManager';
import { QueryMessage, InvokeResult } from '../abilityprovider/AbilityTypes';
import { testFunc } from '../entryability/EntryAbility';

const TAG: string = 'ChatPage';

type AgentStepType = 'thought' | 'skill' | 'action' | 'observation' | 'final';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'agent';
  timestamp: number;
  stepType?: AgentStepType;
}

interface GeneratedTypeLiteralInterface_1 {
  namespace: string;
  name: string;
}

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  allowedTools: Array<GeneratedTypeLiteralInterface_1>;
}

interface ToolPlan {
  reason: string;
  query: QueryMessage;
}

@Entry
@Component
struct ChatPage {
  @State messages: Message[] = [];
  @State inputText: string = '';
  @State isSending: boolean = false;
  @State scrollToBottom: number = 0;
  private scroller: Scroller = new Scroller();
  private abilityManager: GeneralAbilityManager = GeneralAbilityManager.getInstance();
  private readonly defaultFilePath: string = '/data/storage/el2/base/files';
  private readonly skills: SkillDefinition[] = [
    {
      id: 'file_ops',
      name: 'FileOps',
      description: '处理文件查看相关请求',
      keywords: ['file', '文件', '目录', 'list', 'ls', 'path'],
      allowedTools: [{ namespace: 'File', name: 'listFile' }]
    },
    {
      id: 'calendar_ops',
      name: 'CalendarOps',
      description: '处理日历查询请求',
      keywords: ['calendar', '日历', 'schedule', '会议', 'event'],
      allowedTools: [{ namespace: 'Calendar', name: 'getEvents' }]
    },
    {
      id: 'contact_ops',
      name: 'ContactOps',
      description: '处理联系人查询请求',
      keywords: ['contact', '联系人', 'phonebook'],
      allowedTools: [{ namespace: 'Contact', name: 'queryContact' }]
    },
    {
      id: 'general',
      name: 'General',
      description: '通用问答和澄清',
      keywords: [],
      allowedTools: []
    }
  ];

  aboutToAppear() {
    this.messages.push({
      id: this.generateId(),
      content:
        'Hello! I am WorkflowCelia Agent.\n' +
        'This page now shows ReAct steps: Thought -> Skill -> Action -> Observation -> Final.',
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
    const userInput = this.inputText;
    this.inputText = '';
    this.isSending = true;
    this.scrollToBottom++;

    void this.processUserInput(userInput);
  }

  async processUserInput(input: string) {
    try {
      await this.runReactFlow(input);
    } catch (error) {
      logger.error(TAG, `Failed to process input: ${JSON.stringify(error)}`);
      const errorMessage: Message = {
        id: this.generateId(),
        content: 'Final: Sorry, I encountered an error. Please try again.',
        role: 'agent',
        timestamp: Date.now(),
        stepType: 'final'
      };
      this.messages.push(errorMessage);
      this.scrollToBottom++;
    } finally {
      this.isSending = false;
    }
  }

  private async runReactFlow(input: string): Promise<void> {
    const thought = `I should understand the user intent and decide whether I need a tool call.\nUser Input: ${input}`;
    this.appendAgentStep('thought', thought);
    await this.delay(120);

    const skill = this.resolveSkill(input);
    this.appendAgentStep(
      'skill',
      `Selected skill: ${skill.name}\nDescription: ${skill.description}\nAllowed tools: ${this.formatAllowedTools(skill)}`
    );
    await this.delay(120);

    const toolPlan = this.planToolCall(input, skill);
    if (!toolPlan) {
      this.appendAgentStep(
        'action',
        'No tool call is required for this input. I will answer directly.'
      );
      await this.delay(120);
      this.appendAgentStep(
        'observation',
        'No external tool result. Observation is based on intent analysis only.'
      );
      await this.delay(120);
      this.appendAgentStep(
        'final',
        `I understood your request with skill "${skill.name}". ` +
          'No tool was invoked in this turn. For tool execution demo, try inputs like:\n' +
          '- "list files"\n- "show calendar events"\n- "query contact Alice"'
      );
      return;
    }

    this.appendAgentStep(
      'action',
      `Invoke tool:\n${this.prettyQuery(toolPlan.query)}\nReason: ${toolPlan.reason}`
    );
    await this.delay(120);

    const invokeResult = await this.abilityManager.handleQueryMessage(toolPlan.query);
    this.appendAgentStep('observation', `Tool result:\n${this.safeJson(invokeResult)}`);
    await this.delay(120);

    if (invokeResult.success) {
      this.appendAgentStep(
        'final',
        `Tool executed successfully.\nSummary: ${this.summarizeSuccess(toolPlan.query, invokeResult)}`
      );
      return;
    }

    this.appendAgentStep(
      'final',
      `Tool execution failed.\nErrorCode: ${invokeResult.errorCode ?? 'UNKNOWN'}\n` +
        `Error: ${invokeResult.error ?? 'Unknown error'}`
    );
  }

  private resolveSkill(input: string): SkillDefinition {
    const lowerInput = input.toLowerCase();
    for (const skill of this.skills) {
      if (skill.id === 'general') {
        continue;
      }
      for (const keyword of skill.keywords) {
        if (lowerInput.includes(keyword)) {
          return skill;
        }
      }
    }
    return this.skills[this.skills.length - 1];
  }

  private formatAllowedTools(skill: SkillDefinition): string {
    if (skill.allowedTools.length === 0) {
      return '(none)';
    }
    return skill.allowedTools.map((tool) => `${tool.namespace}.${tool.name}`).join(', ');
  }

  private planToolCall(input: string, skill: SkillDefinition): ToolPlan | null {
    if (skill.id === 'file_ops') {
      const pathMatch = input.match(/(?:path|路径)\s*[:=]\s*([^\s,]+)/i);
      const path = pathMatch && pathMatch[1] ? pathMatch[1] : this.defaultFilePath;
      return {
        reason: 'File skill matched. Use File.listFile to inspect directory entries.',
        query: {
          header: {
            namespace: 'File',
            name: 'listFile'
          },
          payload: {
            args: { path }
          }
        }
      };
    }

    if (skill.id === 'calendar_ops') {
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      return {
        reason: 'Calendar skill matched. Query recent and upcoming events.',
        query: {
          header: {
            namespace: 'Calendar',
            name: 'getEvents'
          },
          payload: {
            args: { start: now - sevenDaysMs, end: now + sevenDaysMs }
          }
        }
      };
    }

    if (skill.id === 'contact_ops') {
      const keyMatch = input.match(/(?:contact|联系人)\s+([^\s,]+)/i);
      const key = keyMatch && keyMatch[1] ? keyMatch[1] : 'default';
      return {
        reason: 'Contact skill matched. Try queryContact with extracted key.',
        query: {
          header: {
            namespace: 'Contact',
            name: 'queryContact'
          },
          payload: {
            args: { key }
          }
        }
      };
    }

    return null;
  }

  private summarizeSuccess(query: QueryMessage, result: InvokeResult): string {
    const toolName = `${query.header.namespace}.${query.header.name}`;
    if (result.outputs) {
      return `${toolName} -> ${this.safeJson(result.outputs)}`;
    }
    return `${toolName} succeeded with no outputs.`;
  }

  private prettyQuery(query: QueryMessage): string {
    return this.safeJson(query);
  }

  private safeJson(value: object): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_) {
      return String(value);
    }
  }

  private appendAgentStep(stepType: AgentStepType, content: string): void {
    this.messages.push({
      id: this.generateId(),
      content,
      role: 'agent',
      timestamp: Date.now(),
      stepType
    });
    this.scrollToBottom++;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  runTest() {
    logger.info(TAG, 'Test button clicked, running test function');
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
        Text(this.getStepTitle(message.stepType))
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
