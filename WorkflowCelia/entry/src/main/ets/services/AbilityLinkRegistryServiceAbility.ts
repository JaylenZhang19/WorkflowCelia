import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { rpc } from '@kit.IPCKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { AbilityLinkRegistryHandler, AbilityLinkRegistryStub } from 'ability_link';
import { AbilityLinkService } from './AbilityLinkService';

const DOMAIN = 0x2101;
const TAG = 'AbilityLinkRegistryServiceAbility';

export default class AbilityLinkRegistryServiceAbility extends AppServiceExtensionAbility {
  private registryStub: AbilityLinkRegistryStub | null = null;

  onCreate(): void {
    hilog.info(DOMAIN, TAG, 'AbilityLinkRegistryServiceAbility onCreate');
  }

  onDestroy(): void {
    hilog.info(DOMAIN, TAG, 'AbilityLinkRegistryServiceAbility onDestroy');
    this.registryStub = null;
  }

  onConnect(want: Want): rpc.RemoteObject {
    hilog.info(DOMAIN, TAG, 'AbilityLinkRegistryServiceAbility onConnect');

    if (!this.registryStub) {
      const handler: AbilityLinkRegistryHandler = {
        register: (registration) => {
          const service = AbilityLinkService.getInstance();
          try {
            service.registerCapabilities(registration);
          } catch (error) {
            hilog.error(DOMAIN, TAG, 'Registration error: %{public}s', JSON.stringify(error));
          }
        },
        unregister: (bundleName) => {
          const service = AbilityLinkService.getInstance();
          try {
            service.unregisterCapabilities(bundleName);
          } catch (error) {
            hilog.error(DOMAIN, TAG, 'Unregister error: %{public}s', JSON.stringify(error));
          }
        }
      };

      this.registryStub = new AbilityLinkRegistryStub(handler);
    }

    return this.registryStub;
  }
}
