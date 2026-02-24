/**
 * Scripting Actions
 */
import { ActionDefinition, ActionExecutor, ActionResult, createActionDefinition, IWorkflowContext } from '../models/Action';
import { DataType } from '../models/DataType';

export class SetVariableAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'set_variable',
      name: 'Set Variable',
      description: 'Set a variable to a specific value',
      category: 'scripting',
      inputs: [
        { name: 'name', type: DataType.TEXT, required: true, description: 'Variable name' },
        { name: 'value', type: DataType.ANY, required: true, description: 'Value to set' }
      ],
      outputs: [{ name: 'value', type: DataType.ANY, required: true, description: 'The value that was set' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const { name, value } = inputs;
    if (!name) {
      return { success: false, error: 'Variable name is required' };
    }
    context.setVariable(name, value, DataType.ANY);
    return { success: true, outputs: { value } };
  }
}

export class GetVariableAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_variable',
      name: 'Get Variable',
      description: 'Get the value of a variable',
      category: 'scripting',
      inputs: [{ name: 'name', type: DataType.TEXT, required: true, description: 'Variable name' }],
      outputs: [{ name: 'value', type: DataType.ANY, required: true, description: 'The variable value' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const { name } = inputs;
    const value = context.getVariable(name);
    if (value === undefined) {
      return { success: false, error: `Variable '${name}' not found` };
    }
    return { success: true, outputs: { value } };
  }
}

export class LogAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'log',
      name: 'Log Message',
      description: 'Log a message for debugging',
      category: 'scripting',
      inputs: [
        { name: 'message', type: DataType.TEXT, required: true, description: 'Message to log' },
        { name: 'level', type: DataType.TEXT, required: false, default: 'info', description: 'Log level' }
      ],
      outputs: [],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const { message, level = 'info' } = inputs;
    context.log(level as 'debug' | 'info' | 'warn' | 'error', message);
    return { success: true, outputs: {} };
  }
}

export class WaitAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'wait',
      name: 'Wait',
      description: 'Pause execution for a specified duration',
      category: 'scripting',
      inputs: [{ name: 'duration', type: DataType.NUMBER, required: true, description: 'Duration in seconds' }],
      outputs: [],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const { duration = 0 } = inputs;
    if (duration <= 0) {
      return { success: true, outputs: {} };
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        context.log('debug', `Wait completed: ${duration} seconds`);
        resolve({ success: true, outputs: {} });
      }, duration * 1000);
    });
  }
}

export const SCRIPTING_ACTIONS = [
  SetVariableAction,
  GetVariableAction,
  LogAction,
  WaitAction
];
