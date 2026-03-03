export interface QueryMessage {
  header: Header;

  payload: Payload;
}

export interface Header {
  namespace: string;

  name: string;
}

export interface Payload {
  args: Record<string, any>;
}

export interface MockProviderToolCapability {
  id: string;
  namespace: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: AbilityCategory;
  inputs: CapabilityParameter[];
  outputs: CapabilityParameter[];
  tags?: string[];
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