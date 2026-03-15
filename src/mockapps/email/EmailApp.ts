import { FileUtil } from '../../utils';
import { ProjectContext } from '../../env/ProjectContext';
import * as path from 'path';

export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  content: string;
  attachFile?: string;
  isRead: boolean;
  timestamp: number;
}

export interface EmailSendParams {
  to: string[];
  cc?: string[];
  subject: string;
  content: string;
  attachFile?: string;
}

export interface EmailReadOptions {
  limit?: number;
  unreadOnly?: boolean;
  sender?: string;
}

export class EmailApp {
  constructor() {}

  private getStorageDir(): string {
    const context = ProjectContext.getInstance();
    const workspace = context.paths.agentWorkDir;
    
    if (!workspace) {
      throw new Error('Workspace is not set.');
    }
    const dir = path.join(workspace, 'mockapps', 'Email');
    
    const allowedDir = context.paths.allowedDir;
    if (allowedDir && !dir.startsWith(allowedDir)) {
      throw new Error('Permission Denied: Email storage is outside allowed directory.');
    }
    if (!FileUtil.exists(dir)) {
      FileUtil.mkdirp(dir);
    }
    return dir;
  }

  private getFilePath(): string {
    return path.join(this.getStorageDir(), 'emails.json');
  }

  private loadEmails(): Email[] {
    const filePath = this.getFilePath();
    if (!FileUtil.exists(filePath)) {
      return [];
    }
    const content = FileUtil.readTextFile(filePath);
    try {
      return JSON.parse(content) as Email[];
    } catch {
      return [];
    }
  }

  private saveEmails(emails: Email[]): void {
    const filePath = this.getFilePath();
    FileUtil.writeTextFile(filePath, JSON.stringify(emails, null, 2));
  }

  public sendEmail(params: EmailSendParams): void {
    if (!params.to || params.to.length === 0) {
      throw new Error('Receiver (to) is required.');
    }
    if (!params.subject || !params.content) {
      throw new Error('Subject and content are required to send an email.');
    }
    
    const emails = this.loadEmails();
    
    const newEmail: Email = {
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      from: 'me@mock-os.com', // hardcoded sender 
      to: params.to,
      cc: params.cc || [],
      subject: params.subject,
      content: params.content,
      attachFile: params.attachFile,
      isRead: false,
      timestamp: Date.now()
    };
    
    emails.push(newEmail);
    this.saveEmails(emails);
  }

  public readEmail(options: EmailReadOptions = {}): Email[] {
    let emails = this.loadEmails();
    
    if (options.sender) {
      emails = emails.filter(e => e.from === options.sender);
    }
    
    if (options.unreadOnly) {
      emails = emails.filter(e => !e.isRead);
    }
    
    // Reverse so newest are first
    emails = emails.reverse();
    
    // Apply limit, default to 30 if no limit and no filters were given, except if specifically asked. 
    // "if there is no any filter options provided we can just return the most 30 emails"
    let limit = options.limit;
    if (limit === undefined && !options.sender && options.unreadOnly === undefined) {
      limit = 30;
    }
    
    if (limit !== undefined && emails.length > limit) {
      emails = emails.slice(0, limit);
    }
    
    return emails;
  }

  public deleteEmail(id: string): void {
     if (!id) {
        throw new Error('Email ID is required.');
     }
     
     const emails = this.loadEmails();
     const existingIndex = emails.findIndex(e => e.id === id);
     
     if (existingIndex === -1) {
        throw new Error(`Email with ID '${id}' not found.`);
     }
     
     emails.splice(existingIndex, 1);
     this.saveEmails(emails);
  }
}
