import { Tool } from './tools/BaseTool';

import { CalendarAddTool, CalendarDeleteTool, CalendarReadTool } from './tools/CalendarTool';
import { ContactAddTool, ContactDeleteTool, ContactSearchTool } from './tools/ContactTool';
import { EditFileTool, ListDirTool, ReadFileTool, WriteFileTool } from './tools/FileTool';
import { EmailDeleteTool, EmailReadTool, EmailSendTool } from './tools/EmailTool';
import { FinishTool } from './tools/FinishTool';
import { MemoAppendTool, MemoDeleteTool, MemoListTool, MemoReadTool, MemoWriteTool } from './tools/MemoTool';
import { PhotoDeleteTool, PhotoRetrieveTool, PhotoSaveTool } from './tools/PhotoTool';
import { SmsDeleteTool, SmsReadTool, SmsSendTool } from './tools/SmsTool';

export type ToolFactory = (workspace: string | null, allowedDir: string | null) => Tool;

/**
 * Static tool registry.
 *
 * We intentionally avoid dynamic imports (module path + export name) to prevent
 * runtime surprises caused by wrong paths, missing dist outputs, or bundling differences.
 */
export const TOOL_FACTORIES: Record<string, ToolFactory> = {
  // File tools
  read_file: (workspace, allowedDir) => new ReadFileTool(workspace, allowedDir),
  write_file: (workspace, allowedDir) => new WriteFileTool(workspace, allowedDir),
  edit_file: (workspace, allowedDir) => new EditFileTool(workspace, allowedDir),
  list_dir: (workspace, allowedDir) => new ListDirTool(workspace, allowedDir),

  // Memo tools
  memo_read: (workspace, allowedDir) => new MemoReadTool(workspace, allowedDir),
  memo_write: (workspace, allowedDir) => new MemoWriteTool(workspace, allowedDir),
  memo_append: (workspace, allowedDir) => new MemoAppendTool(workspace, allowedDir),
  memo_delete: (workspace, allowedDir) => new MemoDeleteTool(workspace, allowedDir),
  memo_list: (workspace, allowedDir) => new MemoListTool(workspace, allowedDir),

  // Photo tools
  photo_save: (workspace, allowedDir) => new PhotoSaveTool(workspace, allowedDir),
  photo_retrieve: (workspace, allowedDir) => new PhotoRetrieveTool(workspace, allowedDir),
  photo_delete: () => new PhotoDeleteTool(),

  // Contact tools
  contact_add: () => new ContactAddTool(),
  contact_search: () => new ContactSearchTool(),
  contact_delete: () => new ContactDeleteTool(),

  // SMS tools
  sms_send: () => new SmsSendTool(),
  sms_read: () => new SmsReadTool(),
  sms_delete: () => new SmsDeleteTool(),

  // Email tools
  email_send: () => new EmailSendTool(),
  email_read: () => new EmailReadTool(),
  email_delete: () => new EmailDeleteTool(),

  // Calendar tools
  calendar_add: () => new CalendarAddTool(),
  calendar_read: () => new CalendarReadTool(),
  calendar_delete: () => new CalendarDeleteTool(),

  // Control tool
  finish: () => new FinishTool()
};

export function createToolByName(
  toolName: string,
  workspace: string | null,
  allowedDir: string | null
): Tool | null {
  const factory = TOOL_FACTORIES[toolName];
  return factory ? factory(workspace, allowedDir) : null;
}

