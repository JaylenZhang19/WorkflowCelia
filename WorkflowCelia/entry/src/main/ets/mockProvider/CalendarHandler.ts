import { InvokeResult } from "ability_link";
import { AbilityHandler } from "./AbilityHandler";
import { calendarManager } from "@kit.CalendarKit";
import { abilityAccessCtrl, PermissionRequestResult, Permissions } from "@kit.AbilityKit";
import { globalContext } from "../entryability/EntryAbility";
import { logger } from "ability_link/src/main/ets/utils/Logger";

const TAG: string = 'CalendarHandler';

export class CalendarHandler extends AbilityHandler {
  private calendarAccount: calendarManager.CalendarAccount = {
    name: 'WorkflowCelia',
    type: calendarManager.CalendarType.LOCAL,
    displayName: '小艺工作流'
  };

  private config: calendarManager.CalendarConfig = {
    color: '#aabbcc'
  };

  private calendarMgr: calendarManager.CalendarManager;

  private currentCalender: calendarManager.Calendar;

  private isInit: boolean = false;


  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ['addEvent', this.addEvent],
      ['deleteEvent', this.deleteEvent],
      ['getEvents', this.getEvents]
    ]);
    const permissionResult = await this.requestPermission([
      'ohos.permission.READ_CALENDAR',
      'ohos.permission.WRITE_CALENDAR'
    ]);
    logger.info(TAG, `init permissionResult: ${JSON.stringify(permissionResult)}`);
    this.calendarMgr = calendarManager.getCalendarManager(globalContext);
    this.currentCalender = await this.calendarMgr.createCalendar(this.calendarAccount);
    await this.currentCalender.setConfig(this.config);
    this.isInit = true;
    logger.info(TAG, 'init finish');
  }

  async requestPermission(permissions: Array<Permissions>): Promise<PermissionRequestResult> {
    let atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
    let result: PermissionRequestResult = {} as PermissionRequestResult;
    try {
      result = await atManager.requestPermissionsFromUser(globalContext, permissions);
      logger.info(TAG, `requestPermission result: ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error(TAG, `get Permission error, error. Code: ${err.code}, message: ${err.message}`);
    }
    return result;
  }

  public async handleRequest(name: string, args: Record<string, any>): Promise<InvokeResult> {
    if (!this.NAME_MAP.has(name)) {
      return {
        success: false,
        outputs: {
          description: `no name: ${name}`
        }
      }
    }
    const method = this.NAME_MAP.get(name);
    return method(args);
  }

  private getExample(): calendarManager.Event {
    const startTime = new Date().getTime();
    const endTime = new Date().getTime();
    let event: calendarManager.Event = {
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
    return event;
  }

  private addEvent = async (args: Record<string, any>): Promise<InvokeResult> => {
    logger.info(TAG, `addEvent args: ${JSON.stringify(args)}`)
    try {
      const id: number = await this.currentCalender.addEvent(args as calendarManager.Event);
      logger.info(TAG, `addEvent id: ${id}`)
      return {
        success: true,
        outputs: {
          id: id
        }
      }
    } catch (error) {
      logger.error(TAG, `addEvent error: ${JSON.stringify(error)}`);
      return {
        success: false,
        outputs: {
          description: JSON.stringify(error)
        }
      }
    }
  }

  private deleteEvent = async (args: Record<string, any>): Promise<InvokeResult> => {
    try {
      await this.currentCalender.deleteEvent(args.id);
      return {
        success: true,
        outputs: {
          id: args.id
        }
      }
    } catch (error) {
      logger.error(TAG, `deleteEvent error: ${JSON.stringify(error)}`);
      return {
        success: false,
        outputs: {
          description: JSON.stringify(error)
        }
      }
    }
  }

  private getEvents = async (): Promise<InvokeResult> => {
    try {
      const events = await this.currentCalender.getEvents();
      return {
        success: true,
        outputs: {
          events: events
        }
      }
    } catch (error) {
      logger.error(TAG, `getEvents error: ${JSON.stringify(error)}`);
      return {
        success: false,
        outputs: {
          description: JSON.stringify(error)
        }
      }
    }
  }
}
