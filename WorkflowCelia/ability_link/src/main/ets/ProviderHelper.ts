/**
 * AbilityLink SDK - Provider Helper
 * Helper module for provider apps to register and expose capabilities
 */

import { hilog } from '@kit.PerformanceAnalysisKit';
import { common, Want } from '@kit.AbilityKit';
import {
  AbilityLinkCapability,
  InvokeResult,
  RegistrationInfo
} from './types';
import { AbilityLinkProviderStub, AbilityLinkProviderLike } from './Ipc';

const DOMAIN = 0x3000;
const TAG = 'AbilityLink.Provider';

/**
 * Provider Helper for capability providers
 * Extend this class in your AppServiceExtensionAbility to expose capabilities
 */
export abstract class AbilityLinkProvider {
  protected context: common.Context | null = null;
  protected isInitialized: boolean = false;

  /**
   * Get capability metadata
   * Must be implemented by concrete provider
   */
  abstract getCapability(): AbilityLinkCapability;

  /**
   * Initialize the provider
   * Override to add custom initialization logic
   */
  async initialize(context: common.Context): Promise<void> {
    this.context = context;
    this.isInitialized = true;
    hilog.info(DOMAIN, TAG, 'Provider initialized: %{public}s', this.getCapability().name);
  }

  /**
   * Handle invocation request
   * Must be implemented by concrete provider
   * @param inputs - Input parameters from caller
   * @returns Invocation result
   */
  abstract invoke(inputs: Record<string, any>): Promise<InvokeResult>;

  /**
   * Check if capability is available
   * Override to add custom availability logic
   */
  async isAvailable(): Promise<boolean> {
    return this.isInitialized;
  }

  /**
   * Get provider info for registration
   */
  getProviderInfo(): ProviderInfo {
    const capability = this.getCapability();
    return {
      name: capability.name,
      displayName: capability.displayName,
      description: capability.description,
      version: capability.version,
      category: capability.category,
      icon: capability.icon,
      inputs: capability.inputs,
      outputs: capability.outputs,
      permissions: capability.permissions,
      requiresConfirmation: capability.requiresConfirmation
    };
  }

  /**
   * Validate input parameters
   */
  protected validateInputs(inputs: Record<string, any>): { valid: boolean; error?: string } {
    const capability = this.getCapability();

    for (const input of capability.inputs) {
      if (input.required && (inputs[input.name] === undefined || inputs[input.name] === null)) {
        return {
          valid: false,
          error: `Missing required parameter: ${input.name}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Cleanup resources
   * Override to add custom cleanup logic
   */
  dispose(): void {
    this.context = null;
    this.isInitialized = false;
    hilog.info(DOMAIN, TAG, 'Provider disposed: %{public}s', this.getCapability().name);
  }
}

/**
 * Provider info for registration
 */
export interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: string;
  icon?: string;
  inputs: any[];
  outputs: any[];
  permissions: string[];
  requiresConfirmation: boolean;
}

/**
 * Helper function to create AbilityLink metadata for module.json5
 * Use this to generate the metadata section for your capability
 */
export function createAbilityLinkMetadata(capability: AbilityLinkCapability): AbilityLinkMetadata {
  return {
    name: 'ability-link.capability',
    value: JSON.stringify({
      name: capability.name,
      displayName: capability.displayName,
      description: capability.description,
      version: capability.version,
      category: capability.category,
      icon: capability.icon,
      inputs: capability.inputs,
      outputs: capability.outputs,
      permissions: capability.permissions,
      requiresConfirmation: capability.requiresConfirmation,
      metadata: capability.metadata
    })
  };
}

/**
 * AbilityLink metadata entry for module.json5
 */
export interface AbilityLinkMetadata {
  name: string;
  value: string;
}

/**
 * Base class for multi-capability providers
 * Use when your app provides multiple capabilities
 */
export abstract class MultiCapabilityProvider {
  protected context: common.UIAbilityContext | null = null;
  protected isInitialized: boolean = false;

  /**
   * Get all capability metadata
   */
  abstract getCapabilities(): AbilityLinkCapability[];

  /**
   * Initialize the provider
   */
  async initialize(context: common.UIAbilityContext): Promise<void> {
    this.context = context;
    this.isInitialized = true;
    const caps = this.getCapabilities();
    hilog.info(DOMAIN, TAG, 'Multi-capability provider initialized with %{public}d capabilities', caps.length);
  }

  /**
   * Invoke a specific capability
   * @param capabilityName - Name of capability to invoke
   * @param inputs - Input parameters
   */
  async invokeCapability(capabilityName: string, inputs: Record<string, any>): Promise<InvokeResult> {
    const capabilities = this.getCapabilities();
    const capability = capabilities.find(cap => cap.name === capabilityName);

    if (!capability) {
      return {
        success: false,
        error: `Capability not found: ${capabilityName}`,
        errorCode: 'CAPABILITY_NOT_FOUND'
      };
    }

    return this.invoke(capabilityName, inputs);
  }

  /**
   * Handle invocation for a specific capability
   * Must be implemented by concrete provider
   */
  abstract invoke(capabilityName: string, inputs: Record<string, any>): Promise<InvokeResult>;

  /**
   * Check if a specific capability is available
   */
  async isCapabilityAvailable(capabilityName: string): Promise<boolean> {
    const capabilities = this.getCapabilities();
    const capability = capabilities.find(cap => cap.name === capabilityName);
    return !!capability && this.isInitialized;
  }

  /**
   * Get all provider infos for registration
   */
  getAllProviderInfos(): ProviderInfo[] {
    return this.getCapabilities().map(capability => ({
      name: capability.name,
      displayName: capability.displayName,
      description: capability.description,
      version: capability.version,
      category: capability.category,
      icon: capability.icon,
      inputs: capability.inputs,
      outputs: capability.outputs,
      permissions: capability.permissions,
      requiresConfirmation: capability.requiresConfirmation
    }));
  }

  /**
   * Get registration info
   */
  getRegistrationInfo(): RegistrationInfo {
    const abilityInfo = (this.context as common.UIAbilityContext)?.abilityInfo;
    return {
      bundleName: abilityInfo?.bundleName || 'unknown',
      bundleDisplayName: abilityInfo?.label || abilityInfo?.bundleName || 'Unknown',
      capabilities: this.getCapabilities()
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.context = null;
    this.isInitialized = false;
    hilog.info(DOMAIN, TAG, 'Multi-capability provider disposed');
  }
}

/**
 * Create IPC stub for provider
 */
export function createProviderStub(provider: AbilityLinkProvider | MultiCapabilityProvider): AbilityLinkProviderStub {
  const handler: AbilityLinkProviderLike = {
    invoke: async (capabilityName: string, inputs: Record<string, any>): Promise<InvokeResult> => {
      if (provider instanceof MultiCapabilityProvider) {
        return provider.invokeCapability(capabilityName, inputs);
      }

      const singleProvider = provider as AbilityLinkProvider;
      const definedName = singleProvider.getCapability().name;
      if (capabilityName && definedName !== capabilityName) {
        return {
          success: false,
          error: `Capability not found: ${capabilityName}`,
          errorCode: 'CAPABILITY_NOT_FOUND'
        };
      }

      return singleProvider.invoke(inputs);
    }
  };

  return new AbilityLinkProviderStub(handler);
}
