/**
 * Ability Registry
 * Central registry for all ability providers
 */

import { logger } from '../utils/Logger';
import { IAbilityProvider, IRemoteAbilityProvider, AbilityDefinition, AbilityMeta } from './IAbilityProvider';
import { AbilityInfo } from './AbilityCallProtocol';

/**
 * Ability registration entry
 */
export interface AbilityEntry {
  /** Ability provider instance */
  provider: IAbilityProvider;
  /** Whether this is a remote ability */
  isRemote: boolean;
  /** Registration timestamp */
  registeredAt: number;
}

/**
 * Ability Registry Configuration
 */
export interface AbilityRegistryConfig {
  /** Auto-discover remote abilities */
  autoDiscover: boolean;
  /** Discovery interval in milliseconds */
  discoveryInterval?: number;
}

/**
 * Ability Registry
 * Manages registration and discovery of all abilities
 */
export class AbilityRegistry {
  private static instance: AbilityRegistry;
  
  private abilities: Map<string, AbilityEntry> = new Map();
  private abilitiesByCategory: Map<string, Set<string>> = new Map();
  private abilitiesByBundle: Map<string, Set<string>> = new Map();
  private config: AbilityRegistryConfig;
  private discoveryTimer?: number;

  private constructor(config: Partial<AbilityRegistryConfig> = {}) {
    this.config = {
      autoDiscover: false,
      discoveryInterval: 30000,
      ...config
    };
  }

  static getInstance(config?: Partial<AbilityRegistryConfig>): AbilityRegistry {
    if (!AbilityRegistry.instance) {
      AbilityRegistry.instance = new AbilityRegistry(config);
    }
    return AbilityRegistry.instance;
  }

  /**
   * Register an ability provider
   * @param abilityId - Unique ability identifier
   * @param provider - Ability provider instance
   * @param isRemote - Whether this is a remote ability
   */
  register(abilityId: string, provider: IAbilityProvider, isRemote: boolean = false): void {
    if (this.abilities.has(abilityId)) {
      logger.warn('AbilityRegistry', `Ability ${abilityId} is already registered, overwriting`);
    }

    const entry: AbilityEntry = {
      provider,
      isRemote,
      registeredAt: Date.now()
    };

    this.abilities.set(abilityId, entry);

    // Index by category
    const meta = provider.getMeta();
    const categorySet = this.abilitiesByCategory.get(meta.category) || new Set();
    categorySet.add(abilityId);
    this.abilitiesByCategory.set(meta.category, categorySet);

    // Index by bundle
    const bundleSet = this.abilitiesByBundle.get(meta.provider) || new Set();
    bundleSet.add(abilityId);
    this.abilitiesByBundle.set(meta.provider, bundleSet);

    logger.info('AbilityRegistry', `Registered ability: ${abilityId} (remote: ${isRemote})`);
  }

  /**
   * Unregister an ability
   * @param abilityId - Ability identifier
   */
  unregister(abilityId: string): void {
    const entry = this.abilities.get(abilityId);
    if (!entry) {
      logger.warn('AbilityRegistry', `Ability ${abilityId} not found, cannot unregister`);
      return;
    }

    // Clean up provider resources
    if (entry.provider.dispose) {
      entry.provider.dispose();
    }

    // Remove from indexes
    const meta = entry.provider.getMeta();
    const categorySet = this.abilitiesByCategory.get(meta.category);
    if (categorySet) {
      categorySet.delete(abilityId);
    }

    const bundleSet = this.abilitiesByBundle.get(meta.provider);
    if (bundleSet) {
      bundleSet.delete(abilityId);
    }

    this.abilities.delete(abilityId);
    logger.info('AbilityRegistry', `Unregistered ability: ${abilityId}`);
  }

  /**
   * Get ability by ID
   * @param abilityId - Ability identifier
   */
  getAbility(abilityId: string): IAbilityProvider | null {
    const entry = this.abilities.get(abilityId);
    return entry ? entry.provider : null;
  }

  /**
   * Check if ability exists
   * @param abilityId - Ability identifier
   */
  hasAbility(abilityId: string): boolean {
    return this.abilities.has(abilityId);
  }

  /**
   * Get all abilities
   */
  getAllAbilities(): IAbilityProvider[] {
    return Array.from(this.abilities.values()).map(entry => entry.provider);
  }

  /**
   * Get abilities by category
   * @param category - Ability category
   */
  getAbilitiesByCategory(category: string): IAbilityProvider[] {
    const abilityIds = this.abilitiesByCategory.get(category);
    if (!abilityIds) {
      return [];
    }
    const result: IAbilityProvider[] = [];
    for (const id of abilityIds) {
      const provider = this.abilities.get(id)?.provider;
      if (provider) {
        result.push(provider);
      }
    }
    return result;
  }

  /**
   * Get abilities by bundle/provider
   * @param bundle - Bundle name
   */
  getAbilitiesByBundle(bundle: string): IAbilityProvider[] {
    const abilityIds = this.abilitiesByBundle.get(bundle);
    if (!abilityIds) {
      return [];
    }
    const result: IAbilityProvider[] = [];
    for (const id of abilityIds) {
      const provider = this.abilities.get(id)?.provider;
      if (provider) {
        result.push(provider);
      }
    }
    return result;
  }

  /**
   * Get ability info for discovery
   * @param abilityId - Ability identifier
   */
  async getAbilityInfo(abilityId: string): Promise<AbilityInfo | null> {
    const entry = this.abilities.get(abilityId);
    if (!entry) {
      return null;
    }

    const meta = entry.provider.getMeta();
    const available = await entry.provider.isAvailable();

    return {
      id: abilityId,
      name: meta.name,
      bundle: meta.provider,
      category: meta.category,
      description: meta.description,
      version: meta.version,
      available
    };
  }

  /**
   * Get all ability info
   * @param categoryFilter - Optional category filter
   * @param bundleFilter - Optional bundle filter
   */
  async getAllAbilityInfo(categoryFilter?: string, bundleFilter?: string): Promise<AbilityInfo[]> {
    const infos: AbilityInfo[] = [];

    for (const [abilityId, entry] of this.abilities) {
      // Apply filters
      if (categoryFilter && entry.provider.getMeta().category !== categoryFilter) {
        continue;
      }
      if (bundleFilter && entry.provider.getMeta().provider !== bundleFilter) {
        continue;
      }

      const info = await this.getAbilityInfo(abilityId);
      if (info) {
        infos.push(info);
      }
    }

    return infos;
  }

  /**
   * Get remote abilities only
   */
  getRemoteAbilities(): IRemoteAbilityProvider[] {
    return Array.from(this.abilities.values())
      .filter(entry => entry.isRemote)
      .map(entry => entry.provider as IRemoteAbilityProvider);
  }

  /**
   * Get local abilities only
   */
  getLocalAbilities(): IAbilityProvider[] {
    return Array.from(this.abilities.values())
      .filter(entry => !entry.isRemote)
      .map(entry => entry.provider);
  }

  /**
   * Start auto-discovery of remote abilities
   */
  startAutoDiscovery(): void {
    if (this.config.autoDiscover) {
      logger.info('AbilityRegistry', 'Starting auto-discovery of remote abilities');
      
      const discover = async () => {
        // TODO: Implement remote ability discovery via WantAgent
        logger.debug('AbilityRegistry', 'Auto-discovery tick');
      };

      discover();
      this.discoveryTimer = setInterval(discover, this.config.discoveryInterval) as unknown as number;
    }
  }

  /**
   * Stop auto-discovery
   */
  stopAutoDiscovery(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = undefined;
      logger.info('AbilityRegistry', 'Stopped auto-discovery');
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): AbilityRegistryStats {
    return {
      totalAbilities: this.abilities.size,
      localAbilities: this.getLocalAbilities().length,
      remoteAbilities: this.getRemoteAbilities().length,
      categories: Array.from(this.abilitiesByCategory.keys()),
      bundles: Array.from(this.abilitiesByBundle.keys())
    };
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    for (const abilityId of this.abilities.keys()) {
      this.unregister(abilityId);
    }
    this.stopAutoDiscovery();
    logger.info('AbilityRegistry', 'Cleared all registrations');
  }
}

/**
 * Ability registry statistics
 */
export interface AbilityRegistryStats {
  totalAbilities: number;
  localAbilities: number;
  remoteAbilities: number;
  categories: string[];
  bundles: string[];
}
