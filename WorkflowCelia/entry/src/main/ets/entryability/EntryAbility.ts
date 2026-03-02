import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { AbilityLinkService } from '../services/AbilityLinkService';
import { logger } from '../utils/Logger';
import { common } from '@kit.AbilityKit';

import { abilityAccessCtrl, PermissionRequestResult, Permissions } from '@kit.AbilityKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { calendarManager } from '@kit.CalendarKit';
import { CalendarHandler } from '../mockProvider/CalendarHandler';

const TAG = 'EntryAbility';

export let globalContext: common.UIAbilityContext;

export default class EntryAbility extends UIAbility {
  private tripCalendar: calendarManager.Calendar | undefined = undefined;
  private oriEvent: calendarManager.Event | null = null;
  private id: number = 0;

  allPermission: string[] = [];


  async onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): Promise<void> {
    // try {
    //   this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    // } catch (err) {
    //   logger.error(TAG, `Failed to set colorMode. Cause: ${JSON.stringify(err)}`);
    // }
    logger.info(TAG, 'Ability onCreate');
    globalContext = this.context;


    // Initialize AbilityLink Service for IPC capability registration/invocation
    try {
      // const abilityLinkService = AbilityLinkService.getInstance();
      // await abilityLinkService.initialize(this.context);
      logger.info(TAG, 'AbilityLink Service initialized');
    } catch (err) {
      logger.error(TAG, `Failed to initialize AbilityLink Service. Cause: ${JSON.stringify(err)}`);
    }
    logger.info(TAG, 'start')
    await this.createTripCalendarAndEvent();
    logger.info(TAG, 'end')
    // const permissions: Permissions[] = ['ohos.permission.READ_CALENDAR', 'ohos.permission.WRITE_CALENDAR'];
    // let atManager = abilityAccessCtrl.createAtManager();
    // const permissionResult: PermissionRequestResult = await atManager.requestPermissionsFromUser(this.context, permissions);
    // logger.info(TAG, `permissionResult: ${JSON.stringify(permissionResult)}`);
    // const calendarMgr: calendarManager.CalendarManager = calendarManager.getCalendarManager(this.context);
    //
    // let calendar: calendarManager.Calendar;
    // const calendarAccount: calendarManager.CalendarAccount = {
    //   name: 'MyCalendar',
    //   type: calendarManager.CalendarType.LOCAL,
    //   displayName: 'MyCalendar'
    // };
    // const config: calendarManager.CalendarConfig = {
    //   enableReminder: true,
    //   color: '#aabbcc'
    // };
    // logger.info(TAG, 'start to create calendar')
    // // 创建日历账户
    // const data: calendarManager.Calendar = await calendarMgr?.createCalendar(calendarAccount)
    // calendar.setConfig(config);
    //
    // const eventInfo: calendarManager.Event = {
    //   // 日程标题
    //   title: 'title',
    //   // 日程类型
    //   type: calendarManager.EventType.NORMAL,
    //   // 日程开始时间
    //   startTime: new Date().getTime(),
    //   // 日程结束时间
    //   endTime: new Date().getTime() + 60 * 60 * 1000
    // };
    // logger.info(TAG, `start to add event`)
    // const id: number  = await calendarMgr?.editEvent(eventInfo)
    // logger.info(TAG, `id: ${id}`);
  }

  onDestroy(): void {
    logger.info(TAG, 'Ability onDestroy');

    // Dispose AbilityLink Service
    try {
      const abilityLinkService = AbilityLinkService.getInstance();
      abilityLinkService.dispose();
    } catch (err) {
      logger.warn(TAG, `Failed to dispose AbilityLink Service. Cause: ${JSON.stringify(err)}`);
    }
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Main window is created, set main page for this ability
    logger.info(TAG, 'Ability onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        logger.error(TAG, `Failed to load the content. Cause: ${JSON.stringify(err)}`);
        return;
      }
      logger.info(TAG, 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    logger.info(TAG, 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    // Ability has brought to foreground
    logger.info(TAG, 'Ability onForeground');
  }

  onBackground(): void {
    // Ability has back to background
    logger.info(TAG, 'Ability onBackground');
  }


  async createTripCalendarAndEvent(): Promise<void> {
    // let reuslt = await this.requestPermission(['ohos.permission.READ_CALENDAR', 'ohos.permission.WRITE_CALENDAR']);
    // logger.info(TAG, `result: ${JSON.stringify(reuslt)}`)
    //
    // // 指定日历账户信息
    // const calendarAccount: calendarManager.CalendarAccount = {
    //   name: 'TripCalendar',
    //   type: calendarManager.CalendarType.LOCAL,
    //   // 日历账户显示名称：建议使用应用实际名称。
    //   displayName: '高铁出行'
    // };
    // 日历配置信息
    // const config: calendarManager.CalendarConfig = {
    //   // 设置日历账户颜色
    //   color: '#aabbcc'
    // };
    logger.info(TAG, '创建handler')
    const handler = new CalendarHandler();
    logger.info(TAG, '出示handler')
    await handler.init();

    const startTime = new Date().getTime();
    const endTime = new Date().getTime();
    // 日程配置信息
    const event: Record<string, any> = {
      type: calendarManager.EventType.NORMAL,
      // 日程标题
      title: '测试',
      // 开始时间
      startTime: startTime,
      // 结束时间
      endTime: endTime,
      // 是否全天日程
      isAllDay:false,
      // 提醒时间
      reminderTime:[120, 240],
      // 备注
      description: '检票口：南二楼1口或北广场B2候车室 \n座位号：02车04二等座',
      // 一键服务
      service: {
        // 服务类型
        type: calendarManager.ServiceType.TRIP,
        // 服务的uri，格式为DeepLink类型。请根据“一键服务”指导文档配置。
        uri: 'demo://mobile/player?params='
      }

    }
    logger.info(TAG, '开始添加event')
    await handler.handleRequest('addEvent', event)
    logger.info(TAG, '完成添加')
    // try {
    //   const calendarMgr: calendarManager.CalendarManager = calendarManager.getCalendarManager(this.context);
    //   // 创建日历账户
    //   logger.info(TAG, 'create calendarMgr')
    //   // this.tripCalendar = await calendarMgr?.createCalendar(calendarAccount);
    //   this.tripCalendar = await calendarMgr.getCalendar(calendarAccount);
    //   logger.info(TAG, `tripCalendar: ${JSON.stringify(this.tripCalendar)}`)
    //   if (!this.tripCalendar || this.tripCalendar === null) {
    //     console.error('Failed to create calendar. tripCalendar is null.');
    //     return;
    //   }
    //   logger.info(TAG, 'finish creating account')
    //   // 请确保日历账户创建成功后，再进行相关日程的管理
    //   // 设置日历配置信息，设置日历账户颜色
    //   await this.tripCalendar.setConfig(config);
    //   // 添加日程
    //   this.id = await this.tripCalendar.addEvent(event);
    //   this.oriEvent = event;
    //   this.oriEvent.id = this.id;
    //   console.info(`Succeeded in creating calendar and event, result: ${JSON.stringify(this.id)}`);
    // } catch (error) {
    //   console.error(`Failed to create calendar or event. Code: ${error.code}, message: ${error.message}`);
    // }
  }

  async requestPermission(permissions: Array<Permissions>): Promise<PermissionRequestResult> {
    let atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
    try {
      const result = await atManager.requestPermissionsFromUser(this.context, permissions);
      const length = result.authResults.length;
      for (let i = 0; i < length; i++) {
        if (result.authResults[i] === 0) {
          this.allPermission.push(permissions[i]);
        } else if (result.authResults[i] === -1) {
          const objs = this.allPermission.filter((ele) => ele !== permissions[i]);
          this.allPermission = objs;
        }
      }
      return result;
    } catch (err) {
      console.error(`get Permission error, error. Code: ${err.code}, message: ${err.message}`);
    }
  }
}
