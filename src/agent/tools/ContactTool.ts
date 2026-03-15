import { Tool } from './BaseTool';
import { ContactApp, Contact } from '../../mockapps/contact/ContactApp';

/**
 * Tool for adding a contact
 */
export class ContactAddTool extends Tool {
  public readonly name = 'contact_add';
  public readonly description = 'Add a new contact or update an existing contact by name.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Contact full name (required)' },
      nicknames: { type: 'array', items: { type: 'string' }, description: 'List of nicknames' },
      phoneNumbers: { type: 'array', items: { type: 'string' }, description: 'List of phone numbers' },
      address: { type: 'string', description: 'Home or work address' },
      gender: { type: 'string', description: 'Gender' },
      email: { type: 'string', description: 'Email address' },
      notes: { type: 'string', description: 'Additional notes or tags associated with this contact' }
    },
    required: ['name']
  };

  constructor() {
    super();
  }

  async execute(args: Partial<Contact>): Promise<string> {
    try {
      if (!args.name) {
         return 'Error: Contact name is required.';
      }
      
      const app = new ContactApp();
      const newContact: Contact = {
        name: args.name,
        nicknames: args.nicknames || [],
        phoneNumbers: args.phoneNumbers || [],
        address: args.address,
        gender: args.gender,
        email: args.email,
        notes: args.notes
      };
      
      app.addContact(newContact);
      return `Contact successfully added/updated: ${args.name}`;
    } catch (e) {
      return `Error adding contact: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for searching contacts
 */
export class ContactSearchTool extends Tool {
  public readonly name = 'contact_search';
  public readonly description = 'Search for a contact using a query string that matches name, nickname, or phone number.';
  public readonly parameters = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
    },
    required: ['query']
  };

  constructor() {
    super();
  }

  async execute(args: { query: string }): Promise<string> {
    try {
      const app = new ContactApp();
      const results = app.searchContact(args.query);
      
      if (results.length === 0) {
        return 'No contacts found matching the query.';
      }
      
      // Formatting the JSON response back to a readable string for the LLM
      return JSON.stringify(results, null, 2);
    } catch (e) {
      return `Error searching contacts: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for deleting a contact
 */
export class ContactDeleteTool extends Tool {
  public readonly name = 'contact_delete';
  public readonly description = 'Delete a contact by exact name.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Contact full name (required)' }
    },
    required: ['name']
  };

  constructor() {
    super();
  }

  async execute(args: { name: string }): Promise<string> {
    try {
      const app = new ContactApp();
      app.deleteContact(args.name);
      return `Contact successfully deleted: ${args.name}`;
    } catch (e) {
      return `Error deleting contact: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
