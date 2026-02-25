/**
 * Workflow Model Definitions
 */
import { DataType } from './DataType';

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  actions: WorkflowActionNode[];
  color?: string;
}

/**
 * Action node in workflow
 */
export interface WorkflowActionNode {
  actionId: string;
  id: string;
  inputValues: Record<string, any>;
  displayName?: string;
}

/**
 * Generate UUID for workflow/node IDs
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create empty workflow
 */
export function createWorkflow(name: string): Workflow {
  return {
    id: generateUUID(),
    name,
    description: '',
    actions: [],
    color: '#007AFF'
  };
}

/**
 * Create action node
 */
export function createActionNode(actionId: string, displayName?: string): WorkflowActionNode {
  return {
    actionId,
    id: generateUUID(),
    inputValues: {},
    displayName: displayName || actionId
  };
}
