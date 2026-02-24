/**
 * System Actions
 */
import { ActionDefinition, ActionExecutor, ActionResult, createActionDefinition } from '../models/Action';
import { IWorkflowContext } from '../models/Action';
import { DataType } from '../models/DataType';

export class GetCurrentDateAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_current_date',
      name: 'Get Current Date',
      description: 'Get the current date and time',
      category: 'system',
      inputs: [],
      outputs: [
        { name: 'date', type: DataType.TEXT, description: 'Current date as ISO string' },
        { name: 'timestamp', type: DataType.NUMBER, description: 'Current timestamp' }
      ],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const now = new Date();
    return {
      success: true,
      outputs: {
        date: now.toISOString(),
        timestamp: now.getTime()
      }
    };
  }
}

export class GetBatteryLevelAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_battery_level',
      name: 'Get Battery Level',
      description: 'Get the current battery level',
      category: 'system',
      inputs: [],
      outputs: [
        { name: 'level', type: DataType.NUMBER, description: 'Battery level percentage (0-100)' },
        { name: 'charging', type: DataType.BOOLEAN, description: 'Whether device is charging' }
      ],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    // Simulated battery info
    return {
      success: true,
      outputs: {
        level: 75,
        charging: false
      }
    };
  }
}

export class GetCurrentLocationAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_current_location',
      name: 'Get Current Location',
      description: 'Get the current GPS location',
      category: 'system',
      inputs: [
        { name: 'highAccuracy', type: DataType.BOOLEAN, required: false, default: false, description: 'Use high accuracy GPS' }
      ],
      outputs: [
        { name: 'location', type: DataType.LOCATION, description: 'Current location coordinates' },
        { name: 'address', type: DataType.TEXT, description: 'Human-readable address' }
      ],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const location = {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: inputs.highAccuracy ? 5 : 50,
      timestamp: Date.now()
    };

    return {
      success: true,
      outputs: {
        location,
        address: 'New York, NY, USA'
      }
    };
  }
}

export class ShowNotificationAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'show_notification',
      name: 'Show Notification',
      description: 'Display a notification to the user',
      category: 'system',
      inputs: [
        { name: 'title', type: DataType.TEXT, required: true, description: 'Notification title' },
        { name: 'body', type: DataType.TEXT, required: true, description: 'Notification body' },
        { name: 'priority', type: DataType.TEXT, required: false, default: 'default', description: 'Priority' }
      ],
      outputs: [],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const { title, body, priority = 'default' } = inputs;
    context.log('info', `Notification: ${title} - ${body} (${priority})`);
    return { success: true, outputs: {} };
  }
}

export const SYSTEM_ACTIONS = [
  GetCurrentDateAction,
  GetBatteryLevelAction,
  GetCurrentLocationAction,
  ShowNotificationAction
];
