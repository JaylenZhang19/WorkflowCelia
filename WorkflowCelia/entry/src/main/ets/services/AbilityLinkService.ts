/**
 * AbilityLink Service
 * Unified service for capability registration and invocation using AbilityLink SDK
 */

import { hilog } from '@kit.PerformanceAnalysisKit';
import { common } from '@kit.AbilityKit';
import {
  AbilityLinkConsumer,
  InvokeResult,
  AbilityLinkEvent,
  RegistrationInfo,
  RegisteredCapability
} from 'ability_link';

const DOMAIN = 0x2100;
const TAG = 'AbilityLinkService';

/**
 * Capability info for UI display
 */
export interface CapabilityInfo {
  id: string;
  bundleName: string;
  bundleDisplayName: string;
  capabilityName: string;
  displayName: string;
  description: string;
  category: string;
  icon?: string;
  available: boolean;
  inputs: Object[];
  outputs: Object[];
}

/**
 * AbilityLink Service
 * Manages capability registration and invocation
 */
export class AbilityLinkService {
  private static instance: AbilityLinkService;
  private consumer: AbilityLinkConsumer;
  private context: common.UIAbilityContext | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.consumer = AbilityLinkConsumer.getInstance({
      debug: true,
      invocationTimeout: 30000,
      heartbeatInterval: 10000,
      enableCache: true
    });

    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AbilityLinkService {
    if (!AbilityLinkService.instance) {
      AbilityLinkService.instance = new AbilityLinkService();
    }
    return AbilityLinkService.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(context: common.UIAbilityContext): Promise<void> {
    if (this.isInitialized) {
      hilog.warn(DOMAIN, TAG, 'Service already initialized');
      return;
    }

    this.context = context;
    await this.consumer.initialize(context);
    this.isInitialized = true;

    hilog.info(DOMAIN, TAG, 'AbilityLink Service initialized');
  }

  /**
   * Register capabilities from a provider app
   */
  registerCapabilities(registration: RegistrationInfo): void {
    if (!this.isInitialized) {
      hilog.warn(DOMAIN, TAG, 'Service not initialized. Registering capabilities in cold state.');
    }

    this.consumer.registerCapabilities(registration);
    hilog.info(DOMAIN, TAG, 'Registered %{public}d capabilities from %{public}s',
      registration.capabilities.length, registration.bundleName);
  }

  /**
   * Unregister capabilities from a provider app
   */
  unregisterCapabilities(bundleName: string): void {
    if (!this.isInitialized) {
      hilog.warn(DOMAIN, TAG, 'Service not initialized. Unregistering capabilities in cold state.');
    }

    this.consumer.unregisterCapabilities(bundleName);
  }

  /**
   * Get all registered capabilities
   */
  getAllCapabilities(): CapabilityInfo[] {
    const capabilities = this.consumer.getAllCapabilities();
    return capabilities.map(cap => this.toCapabilityInfo(cap));
  }

  /**
   * Invoke a capability
   */
  async invokeCapability(
    bundleName: string,
    capabilityName: string,
    inputs: Record<string, Object>
  ): Promise<InvokeResult> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    hilog.info(DOMAIN, TAG, 'Invoking capability: %{public}s/%{public}s', bundleName, capabilityName);

    return this.consumer.invoke(bundleName, capabilityName, inputs);
  }

  /**
   * Get capability by ID
   */
  getCapability(bundleName: string, capabilityName: string): CapabilityInfo | null {
    const cap = this.consumer.getCapability(bundleName, capabilityName);
    return cap ? this.toCapabilityInfo(cap) : null;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    this.consumer.dispose();
    this.context = null;
    this.isInitialized = false;
    hilog.info(DOMAIN, TAG, 'AbilityLink Service disposed');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.consumer.on(AbilityLinkEvent.CAPABILITY_REGISTERED, (data: Record<string, Object>) => {
      hilog.info(DOMAIN, TAG, 'New capability registered: %{public}s/%{public}s',
        data.bundleName as string, data.capabilityName as string);
    });

    this.consumer.on(AbilityLinkEvent.CAPABILITY_UNREGISTERED, (data: Record<string, Object>) => {
      hilog.info(DOMAIN, TAG, 'Capability unregistered: %{public}s/%{public}s',
        data.bundleName as string, data.capabilityName as string);
    });

    this.consumer.on(AbilityLinkEvent.REGISTRATION_COMPLETE, (data: Record<string, Object>) => {
      hilog.info(DOMAIN, TAG, 'Registration complete: %{public}d capabilities', data.count as number);
    });

    this.consumer.on(AbilityLinkEvent.INVOCATION_STARTED, (data: Record<string, Object>) => {
      hilog.info(DOMAIN, TAG, 'Invocation started: %{public}s/%{public}s',
        data.bundleName as string, data.capabilityName as string);
    });

    this.consumer.on(AbilityLinkEvent.INVOCATION_COMPLETE, (data: Record<string, Object>) => {
      hilog.info(DOMAIN, TAG, 'Invocation completed: %{public}s', (data.success as boolean) ? 'success' : 'failed');
    });

    this.consumer.on(AbilityLinkEvent.INVOCATION_ERROR, (data: Record<string, Object>) => {
      hilog.error(DOMAIN, TAG, 'Invocation error: %{public}s', data.error as string);
    });
  }

  /**
   * Convert RegisteredCapability to CapabilityInfo
   */
  private toCapabilityInfo(cap: RegisteredCapability): CapabilityInfo {
    return {
      id: `${cap.bundleName}.${cap.capabilityName}`,
      bundleName: cap.bundleName,
      bundleDisplayName: cap.bundleDisplayName,
      capabilityName: cap.capabilityName,
      displayName: cap.capability.displayName,
      description: cap.capability.description,
      category: cap.capability.category,
      icon: cap.capability.icon,
      available: cap.available,
      inputs: cap.capability.inputs,
      outputs: cap.capability.outputs
    };
  }
}
