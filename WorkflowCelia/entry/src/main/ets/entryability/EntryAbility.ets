import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { AbilityLinkService } from '../services/AbilityLinkService';
import { logger } from '../utils/Logger';

const TAG = 'EntryAbility';

export default class EntryAbility extends UIAbility {
  async onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): Promise<void> {
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    } catch (err) {
      logger.error(TAG, `Failed to set colorMode. Cause: ${JSON.stringify(err)}`);
    }
    logger.info(TAG, 'Ability onCreate');

    // Initialize AbilityLink Service for IPC capability registration/invocation
    try {
      const abilityLinkService = AbilityLinkService.getInstance();
      await abilityLinkService.initialize(this.context);
      logger.info(TAG, 'AbilityLink Service initialized');
    } catch (err) {
      logger.error(TAG, `Failed to initialize AbilityLink Service. Cause: ${JSON.stringify(err)}`);
    }
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
}
