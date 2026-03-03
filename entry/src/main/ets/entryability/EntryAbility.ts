import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { logger } from '../utils/Logger';
import { common } from '@kit.AbilityKit';
import { QueryMessage } from '../abilityprovider/AbilityTypes';
import { GeneralAbilityManager } from '../abilityprovider/GeneralAbilityManager';

const TAG = 'EntryAbility';

export let globalContext: common.UIAbilityContext;

export default class EntryAbility extends UIAbility {


  async onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): Promise<void> {
    logger.info(TAG, 'Ability onCreate');
    globalContext = this.context;
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    } catch (err) {
      logger.error(TAG, `Failed to set colorMode. Cause: ${JSON.stringify(err)}`);
    }

    this.test();
  }

  private test() {
    const startTime = new Date().getTime();
    const endTime = new Date().getTime();
    let event: object = {
      type: 0,
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
        type: 'Trip',
        // 服务的uri，格式为DeepLink类型。请根据“一键服务”指导文档配置。
        uri: 'demo://mobile/player?params='
      }
    }
    const query: QueryMessage = {
      header: {
        namespace: 'Calendar',
        name: 'addEvent'
      },
      payload: {
        args: event
      }
    }
    GeneralAbilityManager.getInstance().handleQueryMessage(query);
  }

  onDestroy(): void {
    logger.info(TAG, 'Ability onDestroy');
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
}
