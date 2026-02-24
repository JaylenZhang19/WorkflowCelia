/**
 * Ability Initialization
 * Initialize and register all abilities
 */

import { logger } from '../utils/Logger';
import { AbilityRegistry } from './AbilityRegistry';
import {
  SmsAbility,
  GeofenceAbility,
  AlarmAbility,
  DeviceStatusAbility
} from './SystemAbilities';
import {
  WeChatSendMessageAbility,
  WeChatGetContactsAbility,
  TaobaoSearchProductsAbility,
  TaobaoCreateOrderAbility,
  AlipayPaymentAbility
} from './ThirdPartyAbilities';

/**
 * Initialize all system and third-party abilities
 */
export function initializeAbilities(): void {
  const registry = AbilityRegistry.getInstance();

  logger.info('AbilityInit', 'Initializing system abilities...');

  // Register system abilities
  registry.register('com.system.sms', new SmsAbility(), false);
  registry.register('com.system.geofence', new GeofenceAbility(), false);
  registry.register('com.system.alarm', new AlarmAbility(), false);
  registry.register('com.system.devicestatus', new DeviceStatusAbility(), false);

  logger.info('AbilityInit', 'Initializing third-party abilities...');

  // Register third-party abilities (remote)
  registry.register('com.tencent.wechat.sendmessage', new WeChatSendMessageAbility(), true);
  registry.register('com.tencent.wechat.getcontacts', new WeChatGetContactsAbility(), true);
  registry.register('com.taobao.searchproducts', new TaobaoSearchProductsAbility(), true);
  registry.register('com.taobao.createorder', new TaobaoCreateOrderAbility(), true);
  registry.register('com.alipay.payment', new AlipayPaymentAbility(), true);

  const stats = registry.getStats();
  logger.info('AbilityInit', 
    `Initialized ${stats.totalAbilities} abilities (${stats.localAbilities} local, ${stats.remoteAbilities} remote)`);
}

/**
 * Initialize the ability communication manager
 */
export async function initializeCommunicationManager(): Promise<void> {
  const manager = await import('../abilities/AbilityCommunicationManager');
  const communicationManager = manager.AbilityCommunicationManager.getInstance({
    defaultTimeout: 30000,
    maxRetries: 3,
    enableLogging: true
  });

  await communicationManager.initialize();
  logger.info('AbilityInit', 'Communication manager initialized');
}

/**
 * Full initialization of the ability layer
 */
export async function initializeAbilityLayer(): Promise<void> {
  logger.info('AbilityInit', 'Starting ability layer initialization...');

  // Initialize abilities
  initializeAbilities();

  // Initialize communication manager
  await initializeCommunicationManager();

  logger.info('AbilityInit', 'Ability layer initialization complete');
}
