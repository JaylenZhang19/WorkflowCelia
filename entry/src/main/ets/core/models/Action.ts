/**
 * Action Model Definitions
 */
import { TypeDescriptor, DataType } from './DataType';

/**
 * Action execution result
 */
export interface ActionResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: string;
}

/**
 * Action definition structure
 */
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  inputs: TypeDescriptor[];
  outputs: TypeDescriptor[];
  version: string;
}

/**
 * Workflow Context interface
 */
export interface IWorkflowContext {
  getVariable(name: string): any;
  setVariable(name: string, value: any, dataType: DataType): void;
  getNodeOutput(nodeId: string, outputName: string): any;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void;
  isCancelled(): boolean;
}

/**
 * Action execution interface
 */
export interface ActionExecutor {
  execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult>;
  getDefinition(): ActionDefinition;
}

/**
 * Action category definition
 */
export interface ActionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/**
 * Built-in action categories
 */
export const BUILTIN_CATEGORIES: ActionCategory[] = [
  { id: 'scripting', name: 'Scripting', icon: '⚡', color: '#FF9500' },
  { id: 'photos', name: 'Photos', icon: '🖼️', color: '#007AFF' },
  { id: 'system', name: 'System', icon: '⚙️', color: '#8E8E93' }
];

/**
 * Helper to create action definition
 */
export function createActionDefinition(def: Partial<ActionDefinition>): ActionDefinition {
  // Ensure all inputs and outputs have required field
  const inputs = (def.inputs || []).map(input => ({
    ...input,
    required: input.required !== undefined ? input.required : false
  }));
  
  const outputs = (def.outputs || []).map(output => ({
    ...output,
    required: output.required !== undefined ? output.required : false
  }));

  return {
    id: def.id || '',
    name: def.name || '',
    description: def.description || '',
    category: def.category || 'system',
    inputs,
    outputs,
    version: def.version || '1.0.0'
  };
}
