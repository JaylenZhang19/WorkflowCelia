import { BackupExtensionAbility, BundleVersion } from '@kit.CoreFileKit';
import { logger } from '../utils/Logger';

const TAG = 'EntryBackupAbility';

export default class EntryBackupAbility extends BackupExtensionAbility {
  async onBackup() {
    logger.info(TAG, 'onBackup ok');
    await Promise.resolve();
  }

  async onRestore(bundleVersion: BundleVersion) {
    logger.info(TAG, `onRestore ok ${JSON.stringify(bundleVersion)}`);
    await Promise.resolve();
  }
}
