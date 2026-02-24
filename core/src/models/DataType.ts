/**
 * Workflow Data Types
 * Defines all supported data types in the workflow system
 */

/**
 * Supported data types
 */
export enum DataType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
  VIDEO = 'video',
  URL = 'url',
  LOCATION = 'location',
  CALENDAR_EVENT = 'calendar_event',
  CONTACT = 'contact',
  MUSIC = 'music',
  HEALTH_DATA = 'health_data',
  MAP_ROUTE = 'map_route',
  OBJECT = 'object',
  ARRAY = 'array',
  ANY = 'any'
}

/**
 * Type descriptor for action inputs/outputs
 */
export interface TypeDescriptor {
  name: string;
  type: DataType;
  required: boolean;
  default?: any;
  description?: string;
  isArray?: boolean;
}

/**
 * Runtime value wrapper with type information
 */
export interface WorkflowValue {
  type: DataType;
  value: any;
  isArray: boolean;
}

/**
 * Type conversion rule for Content Graph Engine
 */
export interface TypeConversion {
  from: DataType;
  to: DataType;
  converter: (value: any) => any | null;
  cost: number;
  description: string;
}

/**
 * Helper utilities for DataType operations
 */
export class DataTypeUtils {
  static isPrimitive(type: DataType): boolean {
    return [DataType.TEXT, DataType.NUMBER, DataType.BOOLEAN].includes(type);
  }

  static isComplex(type: DataType): boolean {
    return !this.isPrimitive(type);
  }

  static isCompatible(source: DataType, target: DataType): boolean {
    if (source === target || target === DataType.ANY) {
      return true;
    }
    if (source === DataType.ANY) {
      return true;
    }
    return false;
  }

  static getDefaultValue(type: DataType): any {
    switch (type) {
      case DataType.TEXT: return '';
      case DataType.NUMBER: return 0;
      case DataType.BOOLEAN: return false;
      case DataType.OBJECT: return {};
      case DataType.ARRAY: return [];
      default: return null;
    }
  }

  static validate(value: any, type: DataType, isArray: boolean = false): boolean {
    if (value === null || value === undefined) {
      return !isArray;
    }
    if (isArray) {
      return Array.isArray(value);
    }
    switch (type) {
      case DataType.TEXT: return typeof value === 'string';
      case DataType.NUMBER: return typeof value === 'number';
      case DataType.BOOLEAN: return typeof value === 'boolean';
      case DataType.OBJECT: return typeof value === 'object' && !Array.isArray(value);
      case DataType.ARRAY: return Array.isArray(value);
      default: return true;
    }
  }
}
