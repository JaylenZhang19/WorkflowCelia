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


  public async init(): Promise<void> {
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
    logger.info(TAG, 'create calendarMgr')
    this.currentCalender = await this.calendarMgr.createCalendar(this.calendarAccount);
    logger.info(TAG, `创建完成currentCalender: ${JSON.stringify(this.currentCalender)}`)

  }

  async requestPermission(permissions: Array<Permissions>): Promise<PermissionRequestResult> {
    let atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
    let result: PermissionRequestResult;
    try {
      result = await atManager.requestPermissionsFromUser(globalContext, permissions);
      logger.info(TAG, `requestPermission result: ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error(TAG, `get Permission error, error. Code: ${err.code}, message: ${err.message}`);
    }
    return result;
  }

  public async handleRequest(name: string, args: Record<string, object>): Promise<InvokeResult> {
    if (!this.NAME_MAP.has(name)) {
      return {
        success: false,
        outputs: {
          description: `no name: ${name}`
        }
      }
    }
    return this.NAME_MAP.get(name)(args);
  }

  private async addEvent(args: Record<string, any>): Promise<InvokeResult> {
    logger.info(TAG, `addEvent args1: }`)
    // const event: calendarManager.Event = JSON.parse(JSON.stringify(args))
    try {
      let currentCalender = await this.calendarMgr.getCalendar();
      logger.info(TAG, '开始添加')
      if (!currentCalender || currentCalender === null) {
        logger.error(TAG, 'Failed to create calendar. tripCalendar is null.');
        return;
      }
      await this.currentCalender.setConfig(this.config);
      const startTime = new Date().getTime();
      const endTime = new Date().getTime();
      const id: number = await this.currentCalender.addEvent({
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

      });
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

  private async deleteEvent(args: Record<string, any>): Promise<InvokeResult> {
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

  private async getEvents(): Promise<InvokeResult> {
    try {
      const events = await this.currentCalender.getEvents();
      return {
        success: true,
        outputs: {
          events: JSON.stringify(events)
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