/**
 * Workflow Context
 * Manages runtime state during workflow execution
 */
import { Workflow } from './Workflow';
import { DataType, WorkflowValue } from './DataType';
import { ActionResult } from './Action';
import { logger } from '..';


/**
 * Result from executing a node
 */
export interface NodeResult {
  nodeId: string;
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
  executionTime: number;
  timestamp: number;
}

/**
 * Execution log entry
 */
export interface ExecutionLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: any;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
  executionTime: number;
  logs: ExecutionLog[];
  nodeResults: Map<string, NodeResult>;
}

/**
 * Workflow Context class
 */
export class WorkflowContext {
  private workflow: Workflow;
  private inputs: Record<string, any>;
  private variables: Map<string, WorkflowVariable>;
  private nodeResults: Map<string, NodeResult>;
  private cancelled: boolean;
  private debugMode: boolean;
  private logs: ExecutionLog[];
  private startTime: number;

  constructor(workflow: Workflow, inputs: Record<string, any> = {}, debugMode: boolean = false) {
    this.workflow = workflow;
    this.inputs = inputs;
    this.variables = new Map();
    this.nodeResults = new Map();
    this.cancelled = false;
    this.debugMode = debugMode;
    this.logs = [];
    this.startTime = Date.now();
  }

  getWorkflow(): Workflow {
    return this.workflow;
  }

  getInput(name: string): any {
    return this.inputs[name];
  }

  setVariable(name: string, value: any, dataType: DataType): void {
    this.variables.set(name, { name, dataType, value });
    this.log('debug', `Variable '${name}' = ${JSON.stringify(value)}`);
  }

  getVariable(name: string): any {
    return this.variables.get(name)?.value;
  }

  getVariableTyped(name: string): WorkflowValue | undefined {
    const variable = this.variables.get(name);
    if (!variable) return undefined;
    return { type: variable.dataType, value: variable.value, isArray: Array.isArray(variable.value) };
  }

  storeNodeResult(nodeId: string, result: ActionResult, executionTime: number): void {
    this.nodeResults.set(nodeId, {
      nodeId,
      success: result.success,
      outputs: result.outputs || {},
      error: result.error,
      executionTime,
      timestamp: Date.now()
    });
  }

  getNodeResult(nodeId: string): NodeResult | undefined {
    return this.nodeResults.get(nodeId);
  }

  getNodeOutput(nodeId: string, outputName: string): any {
    const result = this.nodeResults.get(nodeId);
    return result ? result.outputs[outputName] : undefined;
  }

  getNodeResults(): Map<string, NodeResult> {
    return new Map(this.nodeResults);
  }

  cancel(): void {
    this.cancelled = true;
    logger.info('WorkflowContext', 'Execution cancelled');
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const tag = 'Workflow';
    const nodeId = this.logs.length + 1;
    
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data
    });

    // Use hilog for output
    switch (level) {
      case 'debug':
        logger.debug(tag, message, JSON.stringify(data || {}));
        break;
      case 'info':
        logger.info(tag, message, JSON.stringify(data || {}));
        break;
      case 'warn':
        logger.warn(tag, message, JSON.stringify(data || {}));
        break;
      case 'error':
        logger.error(tag, message, JSON.stringify(data || {}));
        break;
    }
  }

  getLogs(): ExecutionLog[] {
    return [...this.logs];
  }

  getExecutionTime(): number {
    return Date.now() - this.startTime;
  }

  createResult(success: boolean, outputs: Record<string, any>, error?: string): WorkflowExecutionResult {
    return {
      success,
      outputs,
      error,
      executionTime: this.getExecutionTime(),
      logs: this.getLogs(),
      nodeResults: this.getNodeResults()
    };
  }
}

interface WorkflowVariable {
  name: string;
  dataType: DataType;
  value: any;
}
