/**
 * AbilityLink SDK - Consumer
 * Main SDK for consumer apps to register and invoke capabilities
 * 
 * Architecture: Registration-based (not discovery-based)
 * - Provider apps must actively register their capabilities with WorkflowCelia
 * - Consumer app maintains a registry of available capabilities
 */

import { hilog } from '@kit.PerformanceAnalysisKit';
import { common, Want } from '@kit.AbilityKit';
import {
  AbilityLinkConfig,
  DEFAULT_CONFIG,
  AbilityLinkCapability,
  RegisteredCapability,
  InvokeResult,
  AbilityLinkEvent,
  EventListener,
  InitResult,
  RegistrationInfo
} from './types';

const DOMAIN = 0x3001;
const TAG = 'AbilityLink.Consumer';

/**
 * AbilityLink Consumer SDK
 * Use this class to register and invoke capabilities from provider apps
 * 
 * Note: This SDK uses a registration-based architecture.
 * Provider apps must actively register their capabilities.
 */
export class AbilityLinkConsumer {
  private static instance: AbilityLinkConsumer;
  private context: common.UIAbilityContext | null = null;
  private config: AbilityLinkConfig;
  private registeredCapabilities: Map<string, RegisteredCapability> = new Map();
  private eventListeners: Map<AbilityLinkEvent, Set<EventListener>> = new Map();

  private constructor(config?: Partial<AbilityLinkConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeEventListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<AbilityLinkConfig>): AbilityLinkConsumer {
    if (!AbilityLinkConsumer.instance) {
      AbilityLinkConsumer.instance = new AbilityLinkConsumer(config);
    }
    return AbilityLinkConsumer.instance;
  }

  /**
   * Initialize the SDK
   */
  async initialize(context: common.UIAbilityContext): Promise<InitResult> {
    try {
      this.context = context;
      hilog.info(DOMAIN, TAG, 'AbilityLink Consumer initializing...');

      hilog.info(DOMAIN, TAG, 'AbilityLink Consumer initialized successfully');

      return {
        success: true,
        registeredCount: this.registeredCapabilities.size
      };
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'Failed to initialize: %{public}s', JSON.stringify(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown initialization error'
      };
    }
  }

  /**
   * Register capabilities from a provider app
   * Call this method when a provider app registers with WorkflowCelia
   */
  registerCapabilities(registration: RegistrationInfo): void {
    if (!this.context) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    hilog.info(DOMAIN, TAG, 'Registering %{public}d capabilities from %{public}s',
      registration.capabilities.length, registration.bundleName);

    for (const capability of registration.capabilities) {
      const key = this.getCapabilityKey(registration.bundleName, capability.name);
      
      const registeredCap: RegisteredCapability = {
        bundleName: registration.bundleName,
        bundleDisplayName: registration.bundleDisplayName,
        capabilityName: capability.name,
        capability: capability,
        registeredAt: Date.now(),
        available: true
      };

      this.registeredCapabilities.set(key, registeredCap);
      this.emit(AbilityLinkEvent.CAPABILITY_REGISTERED, registeredCap);
    }

    this.emit(AbilityLinkEvent.REGISTRATION_COMPLETE, {
      bundleName: registration.bundleName,
      count: registration.capabilities.length
    });

    hilog.info(DOMAIN, TAG, 'Registered %{public}d capabilities', registration.capabilities.length);
  }

  /**
   * Unregister capabilities from a provider app
   * Call this method when a provider app is uninstalled or disabled
   */
  unregisterCapabilities(bundleName: string): void {
    let removedCount = 0;

    for (const [key, capability] of this.registeredCapabilities) {
      if (capability.bundleName === bundleName) {
        this.registeredCapabilities.delete(key);
        this.emit(AbilityLinkEvent.CAPABILITY_UNREGISTERED, capability);
        removedCount++;
      }
    }

    hilog.info(DOMAIN, TAG, 'Unregistered %{public}d capabilities from %{public}s',
      removedCount, bundleName);
  }

  /**
   * Get all registered capabilities
   */
  getAllCapabilities(): RegisteredCapability[] {
    return Array.from(this.registeredCapabilities.values());
  }

  /**
   * Get capability by bundle name and capability name
   */
  getCapability(bundleName: string, capabilityName: string): RegisteredCapability | null {
    const key = this.getCapabilityKey(bundleName, capabilityName);
    return this.registeredCapabilities.get(key) || null;
  }

  /**
   * Invoke a capability
   * @param bundleName - Provider bundle name
   * @param capabilityName - Capability name
   * @param inputs - Input parameters
   * @param timeout - Optional timeout in ms
   */
  async invoke(
    bundleName: string,
    capabilityName: string,
    inputs: Record<string, any>,
    timeout?: number
  ): Promise<InvokeResult> {
    if (!this.context) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    const invokeTimeout = timeout || this.config.invocationTimeout;
    const capabilityKey = this.getCapabilityKey(bundleName, capabilityName);

    hilog.info(DOMAIN, TAG, 'Invoking capability: %{public}s/%{public}s', bundleName, capabilityName);
    this.emit(AbilityLinkEvent.INVOCATION_STARTED, { bundleName, capabilityName, inputs });

    try {
      // Check if capability is registered
      const capability = this.registeredCapabilities.get(capabilityKey);
      if (!capability) {
        return {
          success: false,
          error: `Capability not registered: ${bundleName}/${capabilityName}`,
          errorCode: 'CAPABILITY_NOT_FOUND'
        };
      }

      if (!capability.available) {
        return {
          success: false,
          error: 'Capability not available',
          errorCode: 'CAPABILITY_UNAVAILABLE'
        };
      }

      // Create Want to invoke the capability
      const want = this.createInvokeWant(bundleName, capabilityName, inputs);

      // Start the ability
      await this.context.startAbility(want);

      hilog.info(DOMAIN, TAG, 'Capability invoked successfully');

      // Return success (response handling depends on provider implementation)
      const result: InvokeResult = {
        success: true,
        outputs: { invoked: true },
        metadata: {
          bundleName,
          capabilityName,
          timestamp: Date.now()
        }
      };

      this.emit(AbilityLinkEvent.INVOCATION_COMPLETE, result);
      return result;
    } catch (error) {
      hilog.error(DOMAIN, TAG, 'Invocation failed: %{public}s', JSON.stringify(error));
      const result: InvokeResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Invocation failed',
        errorCode: 'INVOCATION_ERROR'
      };
      this.emit(AbilityLinkEvent.INVOCATION_ERROR, result);
      return result;
    }
  }

  /**
   * Register event listener
   */
  on(event: AbilityLinkEvent, listener: EventListener): void {
    const listeners = this.eventListeners.get(event) || new Set();
    listeners.add(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Unregister event listener
   */
  off(event: AbilityLinkEvent, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Dispose the SDK
   */
  dispose(): void {
    this.registeredCapabilities.clear();
    this.eventListeners.clear();
    this.context = null;
    hilog.info(DOMAIN, TAG, 'AbilityLink Consumer disposed');
  }

  /**
   * Get registration info for self-registration
   */
  getSelfRegistrationInfo(): RegistrationInfo | null {
    if (!this.context) {
      return null;
    }

    const abilityInfo = (this.context as common.UIAbilityContext).abilityInfo;
    if (!abilityInfo) {
      return null;
    }

    // Get capabilities from module.json5 metadata
    const capabilities: AbilityLinkCapability[] = [];
    
    // Note: In practice, provider apps should maintain their own capability definitions
    // This is a placeholder for self-registration
    return {
      bundleName: abilityInfo.bundleName,
      bundleDisplayName: abilityInfo.label || abilityInfo.bundleName,
      capabilities
    };
  }

  /**
   * Create Want for capability invocation
   */
  private createInvokeWant(
    bundleName: string,
    capabilityName: string,
    inputs: Record<string, any>
  ): Want {
    const want: Want = {
      bundleName,
      abilityName: this.getAbilityNameFromCapability(capabilityName),
      action: this.getActionFromCapability(capabilityName),
      parameters: {
        ...inputs,
        capabilityName
      }
    };

    return want;
  }

  /**
   * Get ability name from capability name
   * Convention: capability "sms.send" -> ability "SmsSendAbility"
   */
  private getAbilityNameFromCapability(capabilityName: string): string {
    const parts = capabilityName.split('.');
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') + 'Ability';
  }

  /**
   * Get action from capability name
   * Convention: capability "sms.send" -> action "ability.action.sms.send"
   */
  private getActionFromCapability(capabilityName: string): string {
    return `ability.action.${capabilityName}`;
  }

  /**
   * Generate capability key
   */
  private getCapabilityKey(bundleName: string, capabilityName: string): string {
    return `${bundleName}.${capabilityName}`;
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    Object.values(AbilityLinkEvent).forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  /**
   * Emit event to listeners
   */
  private emit(event: AbilityLinkEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          hilog.warn(DOMAIN, TAG, 'Event listener error: %{public}s', JSON.stringify(error));
        }
      });
    }

    if (this.config.debug) {
      hilog.debug(DOMAIN, TAG, 'Event emitted: %{public}s, data: %{public}s',
        event, JSON.stringify(data));
    }
  }
}
