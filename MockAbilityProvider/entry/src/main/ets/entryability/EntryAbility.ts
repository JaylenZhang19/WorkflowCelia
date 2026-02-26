import { AbilityConstant, ConfigurationConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { AbilityLinkRegistrar, RegistrationInfo } from 'ability_link';
import { SMS_CAPABILITY } from '../smsserviceability/SmsServiceAbility';
import { EMAIL_CAPABILITY } from '../emailserviceability/EmailServiceAbility';

const DOMAIN = 0x0000;

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    try {
      this.context.getApplicationContext().setColorMode(ConfigurationConstant.ColorMode.COLOR_MODE_NOT_SET);
    } catch (err) {
      hilog.error(DOMAIN, 'testTag', 'Failed to set colorMode. Cause: %{public}s', JSON.stringify(err));
    }
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onCreate');
    void this.registerCapabilities();
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Main window is created, set main page for this ability
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageCreate');

    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(DOMAIN, 'testTag', 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    // Ability has brought to foreground
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onForeground');
  }

  onBackground(): void {
    // Ability has back to background
    hilog.info(DOMAIN, 'testTag', '%{public}s', 'Ability onBackground');
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
      const result = await registrar.register(registration);
      if (result.success) {
        hilog.info(DOMAIN, 'testTag', 'Capabilities registered successfully');
      } else {
        hilog.warn(DOMAIN, 'testTag', 'Capability registration failed: %{public}s', result.error || 'unknown');
      }
    } catch (error) {
      hilog.error(DOMAIN, 'testTag', 'Capability registration error: %{public}s', JSON.stringify(error));
    }
  }
}
