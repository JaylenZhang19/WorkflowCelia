import { Tool } from './BaseTool';
import { SmsApp, SmsReadOptions } from '../../mockapps/sms/SmsApp';

/**
 * Tool for sending an SMS
 */
export class SmsSendTool extends Tool {
  public readonly name = 'sms_send';
  public readonly description = 'Send an SMS message to a specific phone number.';
  public readonly parameters = {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', description: 'Destination phone number (required)' },
      content: { type: 'string', description: 'SMS message content (required)' }
    },
    required: ['phoneNumber', 'content']
  };

  constructor() {
    super();
  }

  async execute(args: { phoneNumber: string; content: string }): Promise<string> {
    try {
      const app = new SmsApp();
      app.sendSms(args.phoneNumber, args.content);
      return `SMS successfully sent to ${args.phoneNumber}`;
    } catch (e) {
      return `Error sending SMS: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for reading SMS messages
 */
export class SmsReadTool extends Tool {
  public readonly name = 'sms_read';
  public readonly description = 'Retrieve SMS messages with optional filters (by phone number, limit, time bounds). Returns a dictionary grouped by phone number.';
  public readonly parameters = {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', description: 'Filter by specific phone number' },
      limit: { type: 'number', description: 'Maximum number of messages to return per conversation' },
      startTime: { type: 'number', description: 'Unix timestamp in milliseconds to filter messages after' },
      endTime: { type: 'number', description: 'Unix timestamp in milliseconds to filter messages before' }
    },
    required: []
  };

  constructor() {
    super();
  }

  async execute(args: SmsReadOptions): Promise<string> {
    try {
      const app = new SmsApp();
      const results = app.readSms(args);
      
      if (Object.keys(results).length === 0) {
        return 'No SMS messages found matching the criteria.';
      }
      return JSON.stringify(results, null, 2);
    } catch (e) {
      return `Error reading SMS: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for deleting all SMS messages for a phone number
 */
export class SmsDeleteTool extends Tool {
  public readonly name = 'sms_delete';
  public readonly description = 'Delete all SMS messages associated with a specific phone number.';
  public readonly parameters = {
    type: 'object',
    properties: {
      phoneNumber: { type: 'string', description: 'Phone number to delete the conversation for (required)' }
    },
    required: ['phoneNumber']
  };

  constructor() {
    super();
  }

  async execute(args: { phoneNumber: string }): Promise<string> {
    try {
      const app = new SmsApp();
      app.deleteSms(args.phoneNumber);
      return `All SMS messages for ${args.phoneNumber} have been successfully deleted.`;
    } catch (e) {
      return `Error deleting SMS: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
