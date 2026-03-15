import { FileUtil } from '../../utils';
import { ProjectContext } from '../../env/ProjectContext';
import * as path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  location?: string;
  attendance?: string[];
  notes?: string;
}

export interface CalendarAddParams {
  title: string;
  startTime: number;
  endTime?: number;
  location?: string;
  attendance?: string[];
  notes?: string;
}

export interface CalendarReadOptions {
  startTime?: number;
  endTime?: number;
}

export class CalendarApp {
  constructor() {}

  private getStorageDir(): string {
    const context = ProjectContext.getInstance();
    const workspace = context.paths.agentWorkDir;
    
    if (!workspace) {
      throw new Error('Workspace is not set.');
    }
    const dir = path.join(workspace, 'mockapps', 'Calendar');
    
    const allowedDir = context.paths.allowedDir;
    if (allowedDir && !dir.startsWith(allowedDir)) {
      throw new Error('Permission Denied: Calendar storage is outside allowed directory.');
    }
    if (!FileUtil.exists(dir)) {
      FileUtil.mkdirp(dir);
    }
    return dir;
  }

  private getFilePath(): string {
    return path.join(this.getStorageDir(), 'events.json');
  }

  private loadEvents(): CalendarEvent[] {
    const filePath = this.getFilePath();
    if (!FileUtil.exists(filePath)) {
      return [];
    }
    const content = FileUtil.readTextFile(filePath);
    try {
      return JSON.parse(content) as CalendarEvent[];
    } catch {
      return [];
    }
  }

  private saveEvents(events: CalendarEvent[]): void {
    const filePath = this.getFilePath();
    FileUtil.writeTextFile(filePath, JSON.stringify(events, null, 2));
  }

  public addEvent(params: CalendarAddParams): void {
    if (!params.title || !params.startTime) {
      throw new Error('Title and start time are required for a calendar event.');
    }
    
    const events = this.loadEvents();
    
    // Default endTime to startTime + 1 hour (3600000 ms) if not provided
    const resolvedEndTime = params.endTime !== undefined ? params.endTime : params.startTime + 3600000;
    
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: params.title,
      startTime: params.startTime,
      endTime: resolvedEndTime,
      location: params.location,
      attendance: params.attendance,
      notes: params.notes
    };
    
    events.push(newEvent);
    // Sort events chronically by start time
    events.sort((a, b) => a.startTime - b.startTime);
    this.saveEvents(events);
  }

  public readEvents(options: CalendarReadOptions = {}): CalendarEvent[] {
    let events = this.loadEvents();
    
    if (options.startTime !== undefined) {
      // Keep events that end after or exactly at the query start time
      events = events.filter(e => e.endTime >= options.startTime!);
    }
    
    if (options.endTime !== undefined) {
      // Keep events that start before or exactly at the query end time
      events = events.filter(e => e.startTime <= options.endTime!);
    }
    
    return events;
  }

  public deleteEvent(id: string): void {
     if (!id) {
        throw new Error('Event ID is required.');
     }
     
     const events = this.loadEvents();
     const existingIndex = events.findIndex(e => e.id === id);
     
     if (existingIndex === -1) {
        throw new Error(`Event with ID '${id}' not found.`);
     }
     
     events.splice(existingIndex, 1);
     this.saveEvents(events);
  }
}
