import { Tool } from './tools/BaseTool';

import { CalendarAddTool, CalendarDeleteTool, CalendarReadTool } from './tools/CalendarTool';
import { ContactAddTool, ContactDeleteTool, ContactSearchTool } from './tools/ContactTool';
import { EditFileTool, ListDirTool, ReadFileTool, WriteFileTool } from './tools/FileTool';
import { EmailDeleteTool, EmailReadTool, EmailSendTool } from './tools/EmailTool';
import { FinishTool } from './tools/FinishTool';
import { MemoAppendTool, MemoDeleteTool, MemoListTool, MemoReadTool, MemoWriteTool } from './tools/MemoTool';
import { PhotoDeleteTool, PhotoRetrieveTool, PhotoSaveTool } from './tools/PhotoTool';
import { SmsDeleteTool, SmsReadTool, SmsSendTool } from './tools/SmsTool';

export type ToolFactory = (workspace: string | null, allowedDirs: string[] | null) => Tool;

/**
 * Static tool registry.
 *
 * We intentionally avoid dynamic imports (module path + export name) to prevent
 * runtime surprises caused by wrong paths, missing dist outputs, or bundling differences.
 */
export const TOOL_FACTORIES: Record<string, ToolFactory> = {
  // File tools
  read_file: (workspace, allowedDirs) => new ReadFileTool(workspace, allowedDirs),
  write_file: (workspace, allowedDirs) => new WriteFileTool(workspace, allowedDirs),
  edit_file: (workspace, allowedDirs) => new EditFileTool(workspace, allowedDirs),
  list_dir: (workspace, allowedDirs) => new ListDirTool(workspace, allowedDirs),

  // Memo tools
  memo_read: (workspace, allowedDirs) => new MemoReadTool(workspace, allowedDirs),
  memo_write: (workspace, allowedDirs) => new MemoWriteTool(workspace, allowedDirs),
  memo_append: (workspace, allowedDirs) => new MemoAppendTool(workspace, allowedDirs),
  memo_delete: (workspace, allowedDirs) => new MemoDeleteTool(workspace, allowedDirs),
  memo_list: (workspace, allowedDirs) => new MemoListTool(workspace, allowedDirs),

  // Photo tools
  photo_save: (workspace, allowedDirs) => new PhotoSaveTool(workspace, allowedDirs),
  photo_retrieve: (workspace, allowedDirs) => new PhotoRetrieveTool(workspace, allowedDirs),
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
  allowedDirs: string[] | null
): Tool | null {
  const factory = TOOL_FACTORIES[toolName];
  return factory ? factory(workspace, allowedDirs) : null;
}
