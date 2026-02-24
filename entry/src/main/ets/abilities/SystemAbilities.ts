/**
 * System Abilities
 * Built-in system capabilities (SMS, Geofence, Alarm, Device Status)
 */

import {
  IAbilityProvider,
  AbilityMeta,
  AbilityDefinition,
  AbilityContext,
  AbilityResult,
  AbilityCategory,
  AbilityParameter
} from './IAbilityProvider';
import { DataType } from '../core/models/DataType';
import { logger } from '../utils/Logger';

// ==================== SMS Ability ====================

export interface SmsMessage {
  phoneNumber: string;
  content: string;
  timestamp?: number;
}

export interface SmsSendResult {
  messageId: string;
  status: 'sent' | 'failed' | 'pending';
}

export class SmsAbility implements IAbilityProvider {
  private meta: AbilityMeta = {
    id: 'com.system.sms',
    name: 'Send SMS',
    description: 'Send SMS messages',
    provider: 'com.ohos.system',
    version: '1.0.0',
    category: AbilityCategory.COMMUNICATION,
    icon: '💬',
    requiresConfirmation: true,
    permissions: ['ohos.permission.SEND_MESSAGES']
  };

  private definition: AbilityDefinition = {
    meta: this.meta,
    inputs: [
      { name: 'phoneNumber', type: DataType.TEXT, required: true, description: 'Recipient phone number' },
      { name: 'content', type: DataType.TEXT, required: true, description: 'Message content' }
    ],
    outputs: [
      { name: 'messageId', type: DataType.TEXT, required: true, description: 'Sent message ID' },
      { name: 'status', type: DataType.TEXT, required: true, description: 'Send status' }
    ]
  };

  getMeta(): AbilityMeta {
    return this.meta;
  }

  getDefinition(): AbilityDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    try {
      const { phoneNumber, content } = inputs;

      if (!phoneNumber || !content) {
        return {
          success: false,
          error: 'Phone number and content are required',
          errorCode: 'INVALID_PARAMETERS'
        };
      }

      // TODO: Replace with actual HarmonyOS SMS API
      logger.info('SmsAbility', `Sending SMS to ${phoneNumber}`);

      // Simulate SMS sending
      const messageId = `sms_${Date.now()}`;
      
      return {
        success: true,
        outputs: {
          messageId,
          status: 'sent'
        },
        metadata: { phoneNumber, contentLength: content.length }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
        errorCode: 'SEND_FAILED'
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Check actual SMS capability
    return true;
  }
}

// ==================== Geofence Ability ====================

export interface Geofence {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  name?: string;
  triggerType: 'enter' | 'exit' | 'both';
}

export interface GeofenceEvent {
  fenceId: string;
  eventType: 'enter' | 'exit';
  timestamp: number;
  location: { latitude: number; longitude: number };
}

export class GeofenceAbility implements IAbilityProvider {
  private meta: AbilityMeta = {
    id: 'com.system.geofence',
    name: 'Geofence',
    description: 'Create and monitor geofences',
    provider: 'com.ohos.system',
    version: '1.0.0',
    category: AbilityCategory.LOCATION,
    icon: '📍',
    requiresConfirmation: false,
    permissions: ['ohos.permission.LOCATION']
  };

  private definition: AbilityDefinition = {
    meta: this.meta,
    inputs: [
      { name: 'action', type: DataType.TEXT, required: true, description: 'Action: create, delete, list' },
      { name: 'fence', type: DataType.OBJECT, required: false, description: 'Geofence definition' },
      { name: 'fenceId', type: DataType.TEXT, required: false, description: 'Geofence ID for deletion' }
    ],
    outputs: [
      { name: 'fenceId', type: DataType.TEXT, required: false, description: 'Created fence ID' },
      { name: 'fences', type: DataType.ARRAY, required: false, description: 'List of fences' },
      { name: 'success', type: DataType.BOOLEAN, required: true, description: 'Operation success' }
    ]
  };

  private fences: Map<string, Geofence> = new Map();

  getMeta(): AbilityMeta {
    return this.meta;
  }

  getDefinition(): AbilityDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    try {
      const action = inputs.action as string;

      switch (action) {
        case 'create': {
          const fence = inputs.fence as Geofence;
          if (!fence) {
            return { success: false, error: 'Fence definition required' };
          }
          const fenceId = `fence_${Date.now()}`;
          fence.id = fenceId;
          this.fences.set(fenceId, fence);
          logger.info('GeofenceAbility', `Created geofence: ${fenceId}`);
          return {
            success: true,
            outputs: { fenceId, success: true }
          };
        }

        case 'delete': {
          const fenceId = inputs.fenceId as string;
          if (!fenceId) {
            return { success: false, error: 'Fence ID required' };
          }
          this.fences.delete(fenceId);
          return { success: true, outputs: { success: true } };
        }

        case 'list': {
          const fences = Array.from(this.fences.values());
          return {
            success: true,
            outputs: { fences, success: true }
          };
        }

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Geofence operation failed'
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// ==================== Alarm Ability ====================

export interface Alarm {
  id: string;
  time: string; // HH:MM format
  label?: string;
  daysOfWeek?: number[]; // 0-6, 0 is Sunday
  enabled: boolean;
  vibration?: boolean;
  sound?: string;
}

export class AlarmAbility implements IAbilityProvider {
  private meta: AbilityMeta = {
    id: 'com.system.alarm',
    name: 'Alarm',
    description: 'Set and manage alarms',
    provider: 'com.ohos.system',
    version: '1.0.0',
    category: AbilityCategory.SYSTEM,
    icon: '⏰',
    requiresConfirmation: false,
    permissions: ['ohos.permission.SET_REMINDER']
  };

  private definition: AbilityDefinition = {
    meta: this.meta,
    inputs: [
      { name: 'action', type: DataType.TEXT, required: true, description: 'Action: set, cancel, list, snooze' },
      { name: 'alarm', type: DataType.OBJECT, required: false, description: 'Alarm definition' },
      { name: 'alarmId', type: DataType.TEXT, required: false, description: 'Alarm ID' },
      { name: 'snoozeMinutes', type: DataType.NUMBER, required: false, description: 'Snooze duration' }
    ],
    outputs: [
      { name: 'alarmId', type: DataType.TEXT, required: false, description: 'Alarm ID' },
      { name: 'alarms', type: DataType.ARRAY, required: false, description: 'List of alarms' },
      { name: 'success', type: DataType.BOOLEAN, required: true }
    ]
  };

  private alarms: Map<string, Alarm> = new Map();

  getMeta(): AbilityMeta {
    return this.meta;
  }

  getDefinition(): AbilityDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    try {
      const action = inputs.action as string;

      switch (action) {
        case 'set': {
          const alarm = inputs.alarm as Alarm;
          if (!alarm || !alarm.time) {
            return { success: false, error: 'Alarm time required' };
          }
          const alarmId = `alarm_${Date.now()}`;
          alarm.id = alarmId;
          alarm.enabled = alarm.enabled !== false;
          this.alarms.set(alarmId, alarm);
          logger.info('AlarmAbility', `Set alarm: ${alarmId} at ${alarm.time}`);
          return {
            success: true,
            outputs: { alarmId, success: true }
          };
        }

        case 'cancel': {
          const alarmId = inputs.alarmId as string;
          if (!alarmId) {
            return { success: false, error: 'Alarm ID required' };
          }
          this.alarms.delete(alarmId);
          return { success: true, outputs: { success: true } };
        }

        case 'list': {
          const alarms = Array.from(this.alarms.values());
          return {
            success: true,
            outputs: { alarms, success: true }
          };
        }

        case 'snooze': {
          const alarmId = inputs.alarmId as string;
          const snoozeMinutes = (inputs.snoozeMinutes as number) || 5;
          if (!alarmId) {
            return { success: false, error: 'Alarm ID required' };
          }
          logger.info('AlarmAbility', `Snoozing alarm ${alarmId} for ${snoozeMinutes} minutes`);
          return { success: true, outputs: { success: true } };
        }

        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Alarm operation failed'
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// ==================== Device Status Ability ====================

export interface DeviceStatus {
  batteryLevel: number;
  isCharging: boolean;
  networkType: 'wifi' | 'cellular' | 'none';
  screenOn: boolean;
  volume: number;
  brightness: number;
  storageAvailable: number;
  memoryAvailable: number;
}

export class DeviceStatusAbility implements IAbilityProvider {
  private meta: AbilityMeta = {
    id: 'com.system.devicestatus',
    name: 'Device Status',
    description: 'Get device status information',
    provider: 'com.ohos.system',
    version: '1.0.0',
    category: AbilityCategory.SYSTEM,
    icon: '📱',
    requiresConfirmation: false,
    permissions: []
  };

  private definition: AbilityDefinition = {
    meta: this.meta,
    inputs: [
      { name: 'statusType', type: DataType.TEXT, required: false, description: 'Type of status: battery, network, storage, all' }
    ],
    outputs: [
      { name: 'status', type: DataType.OBJECT, required: true, description: 'Device status' }
    ]
  };

  getMeta(): AbilityMeta {
    return this.meta;
  }

  getDefinition(): AbilityDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: AbilityContext): Promise<AbilityResult> {
    try {
      const statusType = (inputs.statusType as string) || 'all';

      // TODO: Replace with actual HarmonyOS system APIs
      const status: DeviceStatus = {
        batteryLevel: 85,
        isCharging: false,
        networkType: 'wifi',
        screenOn: true,
        volume: 50,
        brightness: 70,
        storageAvailable: 50000000000, // 50GB
        memoryAvailable: 4000000000 // 4GB
      };

      logger.info('DeviceStatusAbility', `Retrieved device status: ${statusType}`);

      return {
        success: true,
        outputs: { status }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get device status'
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
