/**
 * AbilityLink SDK - Core Types
 * Defines the core type system for capability registration and invocation
 */

/**
 * Capability metadata declared in provider app's module.json5
 */
export interface AbilityLinkCapability {
  /** Unique capability identifier within the bundle */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Capability description */
  description: string;
  /** Capability version (semver format) */
  version: string;
  /** Capability category */
  category: AbilityCategory;
  /** Icon resource path */
  icon?: string;
  /** Input parameter definitions */
  inputs: CapabilityParameter[];
  /** Output parameter definitions */
  outputs: CapabilityParameter[];
  /** Required permissions */
  permissions: string[];
  /** Whether requires user confirmation */
  requiresConfirmation: boolean;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Capability categories
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
  PRODUCTIVITY = 'productivity',
  FINANCE = 'finance',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment',
  CUSTOM = 'custom'
}

/**
 * Capability parameter definition
 */
export interface CapabilityParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: CapabilityDataType;
  /** Whether required */
  required: boolean;
  /** Default value */
  defaultValue?: any;
  /** Parameter description */
  description?: string;
  /** Whether accepts array */
  isArray?: boolean;
  /** Validation rules */
  validation?: ParameterValidation;
}

/**
 * Supported data types
 */
export enum CapabilityDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  DATE = 'date',
  FILE = 'file',
  IMAGE = 'image',
  CONTACT = 'contact',
  LOCATION = 'location'
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
  custom?: string;
}

/**
 * Registered capability info
 */
export interface RegisteredCapability {
  /** Bundle name of provider app */
  bundleName: string;
  /** Bundle display name */
  bundleDisplayName: string;
  /** Capability name */
  capabilityName: string;
  /** Capability metadata */
  capability: AbilityLinkCapability;
  /** Registration timestamp */
  registeredAt: number;
  /** Last heartbeat timestamp */
  lastHeartbeat?: number;
  /** Whether currently available */
  available: boolean;
}

/**
 * Capability registration info
 */
export interface RegistrationInfo {
  /** Bundle name */
  bundleName: string;
  /** Bundle display name */
  bundleDisplayName: string;
  /** Capabilities provided */
  capabilities: AbilityLinkCapability[];
}

/**
 * Capability invocation result
 */
export interface InvokeResult {
  /** Invocation success */
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
 * SDK configuration
 */
export interface AbilityLinkConfig {
  /** Enable debug logging */
  debug: boolean;
  /** Invocation timeout (ms) */
  invocationTimeout: number;
  /** Heartbeat interval for providers (ms) */
  heartbeatInterval: number;
  /** Cache registered capabilities */
  enableCache: boolean;
}

/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG: AbilityLinkConfig = {
  debug: false,
  invocationTimeout: 30000,
  heartbeatInterval: 10000,
  enableCache: true
};

/**
 * SDK events
 */
export enum AbilityLinkEvent {
  /** Capability registered */
  CAPABILITY_REGISTERED = 'capability_registered',
  /** Capability unregistered */
  CAPABILITY_UNREGISTERED = 'capability_unregistered',
  /** Registration completed */
  REGISTRATION_COMPLETE = 'registration_complete',
  /** Invocation started */
  INVOCATION_STARTED = 'invocation_started',
  /** Invocation completed */
  INVOCATION_COMPLETE = 'invocation_complete',
  /** Invocation error */
  INVOCATION_ERROR = 'invocation_error',
  /** Heartbeat received */
  HEARTBEAT_RECEIVED = 'heartbeat_received'
}

/**
 * Event listener function
 */
export type EventListener = (data: any) => void;

/**
 * SDK initialization result
 */
export interface InitResult {
  /** Initialization success */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Number of capabilities registered */
  registeredCount?: number;
}
