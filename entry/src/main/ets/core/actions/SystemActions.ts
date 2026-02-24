/**
 * System Actions
 * Using providers for system capabilities
 */
import { BatteryProvider, LocationProvider, NotificationProvider } from '..';
import { ActionDefinition, ActionExecutor, ActionResult, createActionDefinition, IWorkflowContext } from '../models/Action';
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
        { name: 'date', type: DataType.TEXT, required: true, description: 'Current date as ISO string' },
        { name: 'timestamp', type: DataType.NUMBER, required: true, description: 'Current timestamp' }
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
        { name: 'level', type: DataType.NUMBER, required: true, description: 'Battery level percentage (0-100)' },
        { name: 'charging', type: DataType.BOOLEAN, required: true, description: 'Whether device is charging' }
      ],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = BatteryProvider.getInstance();
      const status = await provider.getBatteryStatus();
      
      return {
        success: true,
        outputs: {
          level: status.level,
          charging: status.charging
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get battery status: ${error instanceof Error ? error.message : String(error)}`
      };
    }
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
        { name: 'location', type: DataType.LOCATION, required: true, description: 'Current location coordinates' },
        { name: 'address', type: DataType.TEXT, required: true, description: 'Human-readable address' }
      ],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = LocationProvider.getInstance();
      const location = await provider.getCurrentLocation(inputs.highAccuracy || false);
      const address = await provider.getAddressFromLocation(location);
      
      return {
        success: true,
        outputs: {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          },
          address: address.formatted
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get location: ${error instanceof Error ? error.message : String(error)}`
      };
    }
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
    try {
      const provider = NotificationProvider.getInstance();
      await provider.showNotification({
        title: inputs.title,
        body: inputs.body,
        priority: inputs.priority as 'low' | 'default' | 'high' || 'default'
      });
      
      return { success: true, outputs: {} };
    } catch (error) {
      return {
        success: false,
        error: `Failed to show notification: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const SYSTEM_ACTIONS = [
  GetCurrentDateAction,
  GetBatteryLevelAction,
  GetCurrentLocationAction,
  ShowNotificationAction
];
