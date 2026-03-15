import { Tool } from './BaseTool';
import { CalendarApp, CalendarAddParams, CalendarReadOptions } from '../../mockapps/calendar/CalendarApp';

/**
 * Tool for adding a new calendar event
 */
export class CalendarAddTool extends Tool {
  public readonly name = 'calendar_add';
  public readonly description = 'Add a new event to the calendar.';
  public readonly parameters = {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Event title (required)' },
      startTime: { type: 'number', description: 'Unix timestamp in milliseconds for event start time (required)' },
      endTime: { type: 'number', description: 'Unix timestamp in milliseconds for event end time (Optional, defaults to 1 hour after start time)' },
      location: { type: 'string', description: 'Event location' },
      attendance: { type: 'array', items: { type: 'string' }, description: 'List of attendees emails or names' },
      notes: { type: 'string', description: 'Additional event notes' }
    },
    required: ['title', 'startTime']
  };

  constructor() {
    super();
  }

  async execute(args: CalendarAddParams): Promise<string> {
    try {
      const app = new CalendarApp();
      app.addEvent(args);
      return `Calendar event '${args.title}' successfully added.`;
    } catch (e) {
      return `Error adding calendar event: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for reading calendar events
 */
export class CalendarReadTool extends Tool {
  public readonly name = 'calendar_read';
  public readonly description = 'Read calendar events filtered by an optional time range.';
  public readonly parameters = {
    type: 'object',
    properties: {
      startTime: { type: 'number', description: 'Unix timestamp in milliseconds. Returns events that end at or after this time.' },
      endTime: { type: 'number', description: 'Unix timestamp in milliseconds. Returns events that start at or before this time.' }
    },
    required: []
  };

  constructor() {
    super();
  }

  async execute(args: CalendarReadOptions): Promise<string> {
    try {
      const app = new CalendarApp();
      const results = app.readEvents(args);
      
      if (results.length === 0) {
        return 'No calendar events found within the given time range.';
      }
      return JSON.stringify(results, null, 2);
    } catch (e) {
      return `Error reading calendar events: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for deleting a calendar event
 */
export class CalendarDeleteTool extends Tool {
  public readonly name = 'calendar_delete';
  public readonly description = 'Delete a calendar event by its unique ID.';
  public readonly parameters = {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier of the calendar event to delete (required)' }
    },
    required: ['id']
  };

  constructor() {
    super();
  }

  async execute(args: { id: string }): Promise<string> {
    try {
      const app = new CalendarApp();
      app.deleteEvent(args.id);
      return `Calendar event with ID '${args.id}' successfully deleted.`;
    } catch (e) {
      return `Error deleting calendar event: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
