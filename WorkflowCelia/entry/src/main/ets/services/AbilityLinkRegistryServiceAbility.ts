import { AppServiceExtensionAbility, Want } from '@kit.AbilityKit';
import { rpc } from '@kit.IPCKit';
import { AbilityLinkRegistryHandler, AbilityLinkRegistryStub } from 'ability_link';
import { AbilityLinkService } from './AbilityLinkService';
import { logger } from '../utils/Logger';

const TAG = 'AbilityLinkRegistryServiceAbility';

export default class AbilityLinkRegistryServiceAbility extends AppServiceExtensionAbility {
  private registryStub: AbilityLinkRegistryStub | null = null;

  onCreate(): void {
    logger.info(TAG, 'AbilityLinkRegistryServiceAbility onCreate');
  }

  onDestroy(): void {
    logger.info(TAG, 'AbilityLinkRegistryServiceAbility onDestroy');
    this.registryStub = null;
  }

  onConnect(want: Want): rpc.RemoteObject {
    logger.info(TAG, 'AbilityLinkRegistryServiceAbility onConnect');

    if (!this.registryStub) {
      const handler: AbilityLinkRegistryHandler = {
        register: (registration) => {
          const service = AbilityLinkService.getInstance();
          try {
            service.registerCapabilities(registration);
          } catch (error) {
            logger.error(TAG, `Registration error: ${JSON.stringify(error)}`);
          }
        },
        unregister: (bundleName) => {
          const service = AbilityLinkService.getInstance();
          try {
            service.unregisterCapabilities(bundleName);
          } catch (error) {
            logger.error(TAG, `Unregister error: ${JSON.stringify(error)}`);
          }
        }
      };

      this.registryStub = new AbilityLinkRegistryStub(handler);
    }

    return this.registryStub;
  }
}
