/**
 * Workflow Engine
 * Core runtime engine for executing workflows
 */
import { Workflow, WorkflowActionNode } from '../models/Workflow';
import { WorkflowContext } from '../models/WorkflowContext';
import { WorkflowExecutionResult } from '../models/WorkflowContext';
import { ActionResult } from '../models/Action';
import { DataType } from '../models/DataType';
import { ActionRegistry } from './ActionRegistry';
import { ContentGraphEngine } from './ContentGraphEngine';

export interface EngineConfig {
  debugMode: boolean;
  timeout: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  debugMode: false,
  timeout: 30000
};

/**
 * Workflow Engine singleton
 */
export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private config: EngineConfig;
  private executingWorkflows: Map<string, WorkflowContext> = new Map();

  private constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<EngineConfig>): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine(config);
    }
    return WorkflowEngine.instance;
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: Workflow,
    inputs: Record<string, any> = {},
    debugMode: boolean = false
  ): Promise<WorkflowExecutionResult> {
    const context = new WorkflowContext(workflow, inputs, debugMode || this.config.debugMode);
    const startTime = Date.now();

    this.executingWorkflows.set(workflow.id, context);
    context.log('info', `Starting workflow '${workflow.name}'`);

    try {
      for (const node of workflow.actions) {
        if (context.isCancelled()) {
          return context.createResult(false, {}, 'Execution cancelled');
        }

        if (Date.now() - startTime > this.config.timeout) {
          return context.createResult(false, {}, 'Execution timeout');
        }

        const result = await this.executeNode(node, context);
        
        if (!result.success) {
          return context.createResult(false, {}, result.error);
        }
      }

      const outputs = this.collectOutputs(context);
      context.log('info', `Workflow completed in ${Date.now() - startTime}ms`);

      return context.createResult(true, outputs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return context.createResult(false, {}, errorMessage);
    } finally {
      this.executingWorkflows.delete(workflow.id);
    }
  }

  /**
   * Execute a single action node
   */
  private async executeNode(node: WorkflowActionNode, context: WorkflowContext): Promise<ActionResult> {
    const executor = ActionRegistry.getInstance().getExecutor(node.actionId);

    if (!executor) {
      return { success: false, error: `Action '${node.actionId}' not found` };
    }

    const definition = executor.getDefinition();
    context.log('info', `Executing: ${definition.name}`);

    try {
      const inputs = this.prepareInputs(node, definition, context);
      const result = await executor.execute(inputs, context);
      context.storeNodeResult(node.id, result, 0);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Prepare inputs with type conversion
   */
  private prepareInputs(
    node: WorkflowActionNode,
    definition: any,
    context: WorkflowContext
  ): Record<string, any> {
    const inputs: Record<string, any> = {};
    const graphEngine = ContentGraphEngine.getInstance();

    for (const inputDef of definition.inputs) {
      let value = node.inputValues[inputDef.name];

      if (value === undefined && inputDef.default !== undefined) {
        value = inputDef.default;
      }

      if (value !== undefined && value !== null) {
        const actualType = this.inferType(value);
        if (actualType !== inputDef.type) {
          const result = graphEngine.convert(value, actualType, inputDef.type);
          if (result.success) {
            value = result.value;
          }
        }
      }

      inputs[inputDef.name] = value;
    }

    return inputs;
  }

  private inferType(value: any): DataType {
    if (value === null || value === undefined) return DataType.ANY;
    if (Array.isArray(value)) return DataType.ARRAY;
    switch (typeof value) {
      case 'string': return DataType.TEXT;
      case 'number': return DataType.NUMBER;
      case 'boolean': return DataType.BOOLEAN;
      case 'object': return DataType.OBJECT;
      default: return DataType.ANY;
    }
  }

  private collectOutputs(context: WorkflowContext): Record<string, any> {
    const outputs: Record<string, any> = {};
    const results = context.getNodeResults();
    
    results.forEach((result, nodeId) => {
      outputs[nodeId] = result.outputs;
    });

    return outputs;
  }

  /**
   * Cancel running workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const context = this.executingWorkflows.get(workflowId);
    if (context) {
      context.cancel();
      return true;
    }
    return false;
  }

  /**
   * Check if workflow is running
   */
  isWorkflowRunning(workflowId: string): boolean {
    return this.executingWorkflows.has(workflowId);
  }
}
