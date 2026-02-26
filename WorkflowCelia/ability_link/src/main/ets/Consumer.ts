/**
 * AbilityLink SDK - Consumer
 * Main SDK for consumer apps to register and invoke capabilities
 * 
 * Architecture: Registration-based (not discovery-based)
 * - Provider apps must actively register their capabilities with WorkflowCelia
 * - Consumer app maintains a registry of available capabilities
 */

import { common } from '@kit.AbilityKit';
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
import {
  AbilityLinkIpcClient,
  AbilityLinkIpcCode,
  AbilityLinkEndpoint,
  AbilityLinkInvokeRequest
} from './Ipc';
import { logger } from './utils/Logger';

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
  private ipcClient: AbilityLinkIpcClient | null = null;

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
      this.ipcClient = new AbilityLinkIpcClient(context);
      logger.info(TAG, 'Consumer initializing');

      logger.info(TAG, 'Consumer initialized successfully');

      return {
        success: true,
        registeredCount: this.registeredCapabilities.size
      };
    } catch (error) {
      logger.error(TAG, `Failed to initialize: ${JSON.stringify(error)}`);
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
      logger.warn(TAG, 'SDK not initialized. Registering capabilities before initialize().');
    }

    logger.info(TAG, `Registering ${registration.capabilities.length} capabilities from ${registration.bundleName}`);

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

    logger.info(TAG, `Registered ${registration.capabilities.length} capabilities`);
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

    logger.info(TAG, `Unregistered ${removedCount} capabilities from ${bundleName}`);
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
    if (!this.ipcClient) {
      throw new Error('IPC client not initialized.');
    }

    const invokeTimeout = timeout || this.config.invocationTimeout;
    const capabilityKey = this.getCapabilityKey(bundleName, capabilityName);

    logger.info(TAG, `Invoking capability: ${bundleName}/${capabilityName}`);
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

      const endpoint = this.getProviderEndpoint(bundleName, capability.capability);
      const request: AbilityLinkInvokeRequest = {
        capabilityName,
        inputs
      };

      const result = await this.ipcClient.request<InvokeResult>(
        endpoint,
        AbilityLinkIpcCode.INVOKE,
        request,
        invokeTimeout
      );

      logger.info(TAG, 'Capability invoked successfully via IPC');

      this.emit(AbilityLinkEvent.INVOCATION_COMPLETE, result);
      return result;
    } catch (error) {
      logger.error(TAG, `Invocation failed: ${JSON.stringify(error)}`);
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
    logger.info(TAG, 'Consumer disposed');
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
   * Get ability name from capability name
   * Convention: capability "sms.send" -> ability "SmsSendAbility"
   */
  private getAbilityNameFromCapability(capabilityName: string): string {
    const parts = capabilityName.split('.');
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') + 'Ability';
  }

  /**
   * Get provider endpoint for IPC invocation
   */
  private getProviderEndpoint(bundleName: string, capability: AbilityLinkCapability): AbilityLinkEndpoint {
    const abilityName = capability.serviceAbilityName || this.getAbilityNameFromCapability(capability.name);
    return {
      bundleName,
      abilityName
    };
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
      logger.warn(TAG, `Event listener error: ${JSON.stringify(error)}`);
        }
      });
    }

    if (this.config.debug) {
      logger.debug(TAG, `Event emitted: ${event}, data: ${JSON.stringify(data)}`);
    }
  }
}
