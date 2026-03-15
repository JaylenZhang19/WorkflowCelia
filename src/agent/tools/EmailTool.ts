import { Tool } from './BaseTool';
import { EmailApp, EmailSendParams } from '../../mockapps/email/EmailApp';

/**
 * Tool for sending an email
 */
export class EmailSendTool extends Tool {
  public readonly name = 'email_send';
  public readonly description = 'Send an email to one or more recipients.';
  public readonly parameters = {
    type: 'object',
    properties: {
      to: { type: 'array', items: { type: 'string' }, description: 'List of receiver email addresses (required)' },
      cc: { type: 'array', items: { type: 'string' }, description: 'List of CC email addresses' },
      subject: { type: 'string', description: 'Email subject (required)' },
      content: { type: 'string', description: 'Email body content (required)' },
      attachFile: { type: 'string', description: 'Path to attached file' }
    },
    required: ['to', 'subject', 'content']
  };

  constructor() {
    super();
  }

  async execute(args: EmailSendParams): Promise<string> {
    try {
      const app = new EmailApp();
      app.sendEmail(args);
      return `Email successfully sent to ${args.to.join(', ')}`;
    } catch (e) {
      return `Error sending email: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for reading emails
 */
export class EmailReadTool extends Tool {
  public readonly name = 'email_read';
  public readonly description = 'Read emails. Supports filtering by maximum limit, unread status, and sender email. If no filters are provided, returns the most recent 30 emails.';
  public readonly parameters = {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Maximum number of returned emails. Defaults to 30 if no filters provided.' },
      unreadOnly: { type: 'boolean', description: 'If true, returns only unread emails.' },
      sender: { type: 'string', description: 'Filter emails strictly by this sender address.' }
    },
    required: []
  };

  constructor() {
    super();
  }

  async execute(args: { limit?: number; unreadOnly?: boolean; sender?: string }): Promise<string> {
    try {
      const app = new EmailApp();
      const results = app.readEmail(args);
      
      if (results.length === 0) {
        return 'No emails found.';
      }
      return JSON.stringify(results, null, 2);
    } catch (e) {
      return `Error reading emails: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for deleting an email
 */
export class EmailDeleteTool extends Tool {
  public readonly name = 'email_delete';
  public readonly description = 'Delete an email by its unique ID.';
  public readonly parameters = {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Unique identifier of the email to delete (required)' }
    },
    required: ['id']
  };

  constructor() {
    super();
  }

  async execute(args: { id: string }): Promise<string> {
    try {
      const app = new EmailApp();
      app.deleteEmail(args.id);
      return `Email with ID '${args.id}' successfully deleted.`;
    } catch (e) {
      return `Error deleting email: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
