import { FileUtil, isPathAllowed } from '../../utils';
import { ProjectContext } from '../../env/ProjectContext';
import * as path from 'path';

export interface Contact {
  name: string;
  nicknames: string[];
  phoneNumbers: string[];
  address?: string;
  gender?: string;
  email?: string;
  notes?: string;
}

export class ContactApp {
  constructor() {}

  private getStorageDir(): string {
    const context = ProjectContext.getInstance();
    const workspace = context.paths.agentWorkDir;
    
    if (!workspace) {
      throw new Error('Workspace is not set.');
    }
    const dir = path.join(workspace, 'mockapps', 'Contact');
    
    const allowedDirs = context.paths.allowedDirs;
    if (!isPathAllowed(dir, allowedDirs)) {
      throw new Error('Permission Denied: Contact storage is outside allowed directory.');
    }
    if (!FileUtil.exists(dir)) {
      FileUtil.mkdirp(dir);
    }
    return dir;
  }

  private getFilePath(): string {
    return path.join(this.getStorageDir(), 'contacts.json');
  }

  private loadContacts(): Contact[] {
    const filePath = this.getFilePath();
    if (!FileUtil.exists(filePath)) {
      return [];
    }
    const content = FileUtil.readTextFile(filePath);
    try {
      return JSON.parse(content) as Contact[];
    } catch {
      return [];
    }
  }

  private saveContacts(contacts: Contact[]): void {
    const filePath = this.getFilePath();
    // JSON format with 2 spaces indentation for readability
    FileUtil.writeTextFile(filePath, JSON.stringify(contacts, null, 2));
  }

  public addContact(contact: Contact): void {
    if (!contact.name) {
      throw new Error('Contact name is required.');
    }
    const contacts = this.loadContacts();
    
    // Check if a contact with the same exact name already exists to prevent duplicate exact names
    const existingIndex = contacts.findIndex(c => c.name === contact.name);
    if (existingIndex !== -1) {
       // Merge or update ? Let's just update existing fields
       contacts[existingIndex] = { ...contacts[existingIndex], ...contact };
    } else {
       contacts.push(contact);
    }
    
    this.saveContacts(contacts);
  }

  public deleteContact(name: string): void {
    if (!name) {
      throw new Error('Contact name is required.');
    }
    const contacts = this.loadContacts();
    const existingIndex = contacts.findIndex(c => c.name === name);
    if (existingIndex === -1) {
      throw new Error(`Contact not found: ${name}`);
    }
    contacts.splice(existingIndex, 1);
    this.saveContacts(contacts);
  }

  public searchContact(query: string): Contact[] {
    const contacts = this.loadContacts();
    if (!query || query.trim() === '') {
      return contacts;
    }
    
    const lowerQuery = query.toLowerCase();
    
    return contacts.filter((contact) => {
      // Name match
      if (contact.name.toLowerCase().includes(lowerQuery)) return true;
      // Nickname match
      if (contact.nicknames && contact.nicknames.some(nick => nick.toLowerCase().includes(lowerQuery))) return true;
      // Phone match
      if (contact.phoneNumbers && contact.phoneNumbers.some(phone => phone.includes(query))) return true;
      
      return false;
    });
  }
}
