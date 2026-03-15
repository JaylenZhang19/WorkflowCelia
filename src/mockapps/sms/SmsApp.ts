import { FileUtil } from '../../utils';
import { ProjectContext } from '../../env/ProjectContext';
import * as path from 'path';

export interface SmsMessage {
  id: string;
  phoneNumber: string;
  content: string;
  timestamp: number;
}

export interface SmsReadOptions {
  phoneNumber?: string;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export class SmsApp {
  constructor() {}

  private getStorageDir(): string {
    const context = ProjectContext.getInstance();
    const workspace = context.paths.agentWorkDir;
    
    if (!workspace) {
      throw new Error('Workspace is not set.');
    }
    const dir = path.join(workspace, 'mockapps', 'SMS');
    
    const allowedDir = context.paths.allowedDir;
    if (allowedDir && !dir.startsWith(allowedDir)) {
      throw new Error('Permission Denied: SMS storage is outside allowed directory.');
    }
    if (!FileUtil.exists(dir)) {
      FileUtil.mkdirp(dir);
    }
    return dir;
  }

  private getFilePath(): string {
    return path.join(this.getStorageDir(), 'sms.json');
  }

  private loadMessages(): Record<string, SmsMessage[]> {
    const filePath = this.getFilePath();
    if (!FileUtil.exists(filePath)) {
      return {};
    }
    const content = FileUtil.readTextFile(filePath);
    try {
      return JSON.parse(content) as Record<string, SmsMessage[]>;
    } catch {
      return {};
    }
  }

  private saveMessages(messages: Record<string, SmsMessage[]>): void {
    const filePath = this.getFilePath();
    FileUtil.writeTextFile(filePath, JSON.stringify(messages, null, 2));
  }

  public sendSms(phoneNumber: string, content: string): void {
    if (!phoneNumber || !content) {
      throw new Error('Phone number and content are required.');
    }
    
    const messages = this.loadMessages();
    if (!messages[phoneNumber]) {
      messages[phoneNumber] = [];
    }
    
    messages[phoneNumber].push({
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      phoneNumber,
      content,
      timestamp: Date.now()
    });
    
    this.saveMessages(messages);
  }

  public readSms(options: SmsReadOptions = {}): Record<string, SmsMessage[]> {
    const messages = this.loadMessages();
    const result: Record<string, SmsMessage[]> = {};

    let keysToProcess = Object.keys(messages);
    if (options.phoneNumber) {
      if (!messages[options.phoneNumber]) {
        return {};
      }
      keysToProcess = [options.phoneNumber];
    }

    for (const key of keysToProcess) {
       let filteredList = messages[key];
       
       if (options.startTime !== undefined) {
          filteredList = filteredList.filter(msg => msg.timestamp >= options.startTime!);
       }
       
       if (options.endTime !== undefined) {
          filteredList = filteredList.filter(msg => msg.timestamp <= options.endTime!);
       }
       
       // Note: typically you might limit *per phone number* or limit *globally*. 
       // For mock purposes, we will apply limit per phone number to recent messages.
       if (options.limit !== undefined && filteredList.length > options.limit) {
          filteredList = filteredList.slice(filteredList.length - options.limit);
       }
       
       if (filteredList.length > 0) {
          result[key] = filteredList;
       }
    }
    
    return result;
  }

  public deleteSms(phoneNumber: string): void {
     if (!phoneNumber) {
        throw new Error('Phone number is required.');
     }
     
     const messages = this.loadMessages();
     if (!messages[phoneNumber]) {
        throw new Error(`No messages found for phone number: ${phoneNumber}`);
     }
     
     delete messages[phoneNumber];
     this.saveMessages(messages);
  }
}
