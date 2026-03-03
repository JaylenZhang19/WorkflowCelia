import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { logger } from '../utils/Logger';
import { common } from '@kit.AbilityKit';
import { QueryMessage } from '../abilityprovider/AbilityTypes';
import { GeneralAbilityManager } from '../abilityprovider/GeneralAbilityManager';

import { voipCall } from '@kit.CallServiceKit';
import { image } from '@kit.ImageKit';
import { hilog } from '@kit.PerformanceAnalysisKit';

import { BusinessError } from '@kit.BasicServicesKit';
import { call } from '@kit.TelephonyKit';

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

  private async test() {
    // logger.info(TAG, 'test start')
    // try {
    //   // 从API15开始支持tel格式电话号码，如："tel:13xxxx"
    //   await call.makeCall("18321667311");
    // } catch (error) {
    //   logger.info(TAG, `error ${JSON.stringify(error)}`)
    // }


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
