import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { AbilityLinkRegistrar, RegistrationInfo } from 'ability_link';
import { SMS_CAPABILITY } from '../smsserviceability/SmsServiceAbility';
import { EMAIL_CAPABILITY } from '../emailserviceability/EmailServiceAbility';
import { logger } from '../utils/Logger';

const TAG = 'EntryAbility';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    } catch (err) {
      logger.error(TAG, `Failed to set colorMode. Cause: ${JSON.stringify(err)}`);
    }
    logger.info(TAG, 'Ability onCreate');
    this.registerCapabilities();
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

  private async registerCapabilities(): Promise<void> {
    try {
      const abilityInfo = this.context.abilityInfo;
      const registration: RegistrationInfo = {
        bundleName: abilityInfo?.bundleName || 'com.pumpkin.mockabilityprovider',
        bundleDisplayName: abilityInfo?.label || abilityInfo?.bundleName || 'MockAbility Provider',
        capabilities: [SMS_CAPABILITY, EMAIL_CAPABILITY]
      };

      const registrar = new AbilityLinkRegistrar(this.context);
      logger.info(TAG, 'registerCapabilities start to register');
      const result = await registrar.register(registration);
      if (result.success) {
        logger.info(TAG, 'Capabilities registered successfully');
      } else {
        logger.warn(TAG, `Capability registration failed: ${result.error || 'unknown'}`);
      }
    } catch (error) {
      logger.error(TAG, `Capability registration error: ${JSON.stringify(error)}`);
    }
  }
}
