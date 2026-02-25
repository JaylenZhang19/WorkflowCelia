/**
 * Ability Provider Interface
 * Unified interface for all capability providers (system and third-party)
 */

import { DataType, TypeDescriptor } from '../core/models/DataType';

/**
 * Ability metadata
 */
export interface AbilityMeta {
  /** Unique ability identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Ability description */
  description: string;
  /** Provider/bundle name */
  provider: string;
  /** Ability version */
  version: string;
  /** Ability category */
  category: AbilityCategory;
  /** Icon representation */
  icon?: string;
  /** Whether this ability requires user confirmation */
  requiresConfirmation: boolean;
  /** Required permissions */
  permissions: string[];
}

/**
 * Ability categories
 */
export enum AbilityCategory {
  SYSTEM = 'system',
  COMMUNICATION = 'communication',
  MEDIA = 'media',
  LOCATION = 'location',
  CALENDAR = 'calendar',
  CONTACTS = 'contacts',
  HEALTH = 'health',
  SMART_HOME = 'smart_home',
  THIRD_PARTY = 'third_party'
}

/**
 * Ability input/output parameter
 */
export interface AbilityParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: DataType;
  /** Whether required */
  required: boolean;
  /** Default value */
  default?: any;
  /** Parameter description */
  description?: string;
  /** Whether accepts array */
  isArray?: boolean;
  /** Validation rules */
  validation?: ParameterValidation;
}

/**
 * Parameter validation rules
 */
export interface ParameterValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
}

/**
 * Ability execution context
 */
export interface AbilityContext {
  /** Get workflow variable */
  getVariable(name: string): any;
  /** Set workflow variable */
  setVariable(name: string, value: any, dataType: DataType): void;
  /** Log message */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void;
  /** Check if execution is cancelled */
  isCancelled(): boolean;
  /** Request user confirmation */
  requestConfirmation(message: string): Promise<boolean>;
}

/**
 * Ability execution result
 */
export interface AbilityResult {
  /** Execution success */
  success: boolean;
  /** Output data */
  outputs?: Record<string, any>;
  /** Error message if failed */
  error?: string;
  /** Error code */
  errorCode?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Ability definition
 */
export interface AbilityDefinition {
  /** Ability metadata */
  meta: AbilityMeta;
  /** Input parameters */
  inputs: AbilityParameter[];
  /** Output parameters */
  outputs: AbilityParameter[];
}

/**
 * Ability Provider Interface
 * All capability providers must implement this interface
 */
export interface IAbilityProvider {
  /**
   * Get ability metadata
   */
  getMeta(): AbilityMeta;

  /**
   * Get ability definition (inputs/outputs)
   */
  getDefinition(): AbilityDefinition;

  /**
   * Execute the ability
   * @param inputs - Input parameters
   * @param context - Execution context
   * @returns Execution result
   */
  execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult>;

  /**
   * Check if the ability is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Initialize the provider
   */
  initialize?(): Promise<void>;

  /**
   * Cleanup resources
   */
  dispose?(): void;
}

/**
 * Remote ability provider (for cross-app communication)
 */
export interface IRemoteAbilityProvider extends IAbilityProvider {
  /**
   * Get the target bundle name
   */
  getTargetBundle(): string;

  /**
   * Get the target ability name
   */
  getTargetAbilityName(): string;
}
