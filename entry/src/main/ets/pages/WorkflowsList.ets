/**
 * Workflows List Page
 * Simple page to execute predefined workflows
 */
import {
  Workflow,
  createWorkflow,
  createActionNode,
  WorkflowEngine,
  initializeBuiltInActions
} from '../core/index';

@Entry
@Component
struct WorkflowsList {
  @State workflows: Workflow[] = [];
  @State executingWorkflow: string = '';
  @State executionResult: string = '';

  aboutToAppear() {
    initializeBuiltInActions();
    this.loadWorkflows();
  }

  loadWorkflows() {
    // Workflow 1: Get current date and log
    const workflow1 = createWorkflow('Get Current Date');
    workflow1.description = '获取当前日期和时间';
    workflow1.color = '#007AFF';
    workflow1.actions = [
      createActionNode('get_current_date', '获取日期'),
      createActionNode('log', '记录日志')
    ];
    workflow1.actions[1].inputValues = { message: '日期已获取', level: 'info' };

    // Workflow 2: Get battery status
    const workflow2 = createWorkflow('Battery Status');
    workflow2.description = '获取电池状态';
    workflow2.color = '#34C759';
    workflow2.actions = [
      createActionNode('get_battery_level', '获取电量')
    ];

    // Workflow 3: Get location
    const workflow3 = createWorkflow('Current Location');
    workflow3.description = '获取当前位置';
    workflow3.color = '#FF9500';
    workflow3.actions = [
      createActionNode('get_current_location', '获取位置'),
      createActionNode('log', '记录位置')
    ];
    workflow3.actions[1].inputValues = { message: '位置已获取', level: 'info' };

    // Workflow 4: Get photos
    const workflow4 = createWorkflow('Get Photos');
    workflow4.description = '获取最新照片';
    workflow4.color = '#FF2D55';
    workflow4.actions = [
      createActionNode('get_latest_photos', '获取照片')
    ];
    workflow4.actions[0].inputValues = { count: 3 };

    // Workflow 5: Calendar events
    const workflow5 = createWorkflow('Calendar Events');
    workflow5.description = '获取即将到来的日程';
    workflow5.color = '#FF3B30';
    workflow5.actions = [
      createActionNode('get_calendar_events', '获取日程')
    ];
    workflow5.actions[0].inputValues = { count: 5 };

    // Workflow 6: Today's events
    const workflow6 = createWorkflow("Today's Schedule");
    workflow6.description = '获取今天的日程安排';
    workflow6.color = '#5856D6';
    workflow6.actions = [
      createActionNode('get_today_events', '今日日程'),
      createActionNode('show_notification', '显示通知')
    ];
    workflow6.actions[1].inputValues = { 
      title: '今日日程', 
      body: '已获取今天的日程安排',
      priority: 'default'
    };

    this.workflows = [workflow1, workflow2, workflow3, workflow4, workflow5, workflow6];
  }

  build() {
    Column() {
      // Navigation Bar
      Row() {
        Text('Workflow')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1C1C1E')
      }
      .width('100%')
      .height(56)
      .padding({ left: 20, right: 20 })
      .backgroundColor('#F2F2F7')

      // Content
      Scroll() {
        Column() {
          Text('工作流列表')
            .fontSize(24)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1C1C1E')
            .width('100%')
            .padding({ left: 20, right: 20, top: 20, bottom: 12 })

          ForEach(this.workflows, (workflow: Workflow) => {
            this.buildWorkflowCard(workflow)
          })

          // Execution Result
          if (this.executionResult) {
            Column() {
              Text('执行结果')
                .fontSize(16)
                .fontWeight(FontWeight.Medium)
                .fontColor('#1C1C1E')
                .width('100%')
                .margin({ bottom: 8 })

              Text(this.executionResult)
                .fontSize(14)
                .fontColor('#8E8E93')
                .width('100%')
                .padding(12)
                .backgroundColor('#F2F2F7')
                .borderRadius(8)
            }
            .width('100%')
            .padding({ left: 20, right: 20, top: 20 })
          }
        }
        .width('100%')
        .padding({ bottom: 20 })
      }
      .layoutWeight(1)
      .scrollBar(BarState.Off)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F2F2F7')
  }

  @Builder
  buildWorkflowCard(workflow: Workflow) {
    Column() {
      Row() {
        Column()
          .width(4)
          .height('100%')
          .backgroundColor(workflow.color || '#007AFF')
          .borderRadius(2)

        Column() {
          Text(workflow.name)
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1C1C1E')

          Text(workflow.description || '')
            .fontSize(14)
            .fontColor('#8E8E93')
            .margin({ top: 4 })

          Text(`${workflow.actions.length} 个动作`)
            .fontSize(12)
            .fontColor('#8E8E93')
            .margin({ top: 8 })
        }
        .layoutWeight(1)
        .margin({ left: 12 })

        Button(this.executingWorkflow === workflow.id ? '执行中...' : '执行')
          .width(80)
          .height(36)
          .fontSize(14)
          .backgroundColor(this.executingWorkflow === workflow.id ? '#8E8E93' : (workflow.color || '#007AFF'))
          .enabled(this.executingWorkflow !== workflow.id)
          .onClick(() => this.executeWorkflow(workflow))
      }
      .width('100%')
      .padding(16)
    }
    .width('100%')
    .backgroundColor('#FFFFFF')
    .borderRadius(12)
    .shadow({ radius: 2, color: '#00000008' })
    .margin({ left: 20, right: 20, bottom: 12 })
  }

  async executeWorkflow(workflow: Workflow) {
    this.executingWorkflow = workflow.id;
    this.executionResult = '';

    const engine = WorkflowEngine.getInstance();

    try {
      const result = await engine.execute(workflow, {}, true);

      if (result.success) {
        this.executionResult = `✓ ${workflow.name} 执行成功\n耗时：${result.executionTime}ms\n日志：${result.logs.length} 条`;
      } else {
        this.executionResult = `✗ ${workflow.name} 执行失败\n错误：${result.error}`;
      }
    } catch (error) {
      this.executionResult = `✗ 执行异常\n${error instanceof Error ? error.message : String(error)}`;
    } finally {
      this.executingWorkflow = '';
    }
  }
}
