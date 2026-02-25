/**
 * Calendar Actions
 * Using providers for calendar capabilities
 */
import { CalendarProvider } from '..';
import { ActionDefinition, ActionExecutor, ActionResult, createActionDefinition, IWorkflowContext } from '../models/Action';
import { DataType } from '../models/DataType';


export class GetCalendarEventsAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_calendar_events',
      name: 'Get Calendar Events',
      description: 'Get upcoming calendar events',
      category: 'calendar',
      inputs: [
        { name: 'count', type: DataType.NUMBER, required: false, default: 5, description: 'Number of events to retrieve' }
      ],
      outputs: [{ name: 'events', type: DataType.ARRAY, required: true, description: 'Array of calendar events' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = CalendarProvider.getInstance();
      const count = inputs.count || 5;
      const events = await provider.getUpcomingEvents(count);
      
      context.log('info', `Retrieved ${events.length} calendar events`);
      return { 
        success: true, 
        outputs: { 
          events: events.map(e => ({
            title: e.title,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate.toISOString(),
            location: e.location,
            description: e.description
          }))
        } 
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get calendar events: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class GetTodayEventsAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_today_events',
      name: "Get Today's Events",
      description: "Get calendar events for today",
      category: 'calendar',
      inputs: [],
      outputs: [{ name: 'events', type: DataType.ARRAY, required: true, description: "Array of today's calendar events" }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = CalendarProvider.getInstance();
      const events = await provider.getTodayEvents();
      
      context.log('info', `Found ${events.length} events today`);
      return { 
        success: true, 
        outputs: { 
          events: events.map(e => ({
            title: e.title,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate.toISOString(),
            location: e.location
          }))
        } 
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get today's events: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const CALENDAR_ACTIONS = [
  GetCalendarEventsAction,
  GetTodayEventsAction
];
