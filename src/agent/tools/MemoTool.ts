import { Tool } from './BaseTool';
import { MemoApp } from '../../mockapps/memo/MemoApp';

/**
 * 读取备忘录工具
 */
export class MemoReadTool extends Tool {
  public readonly name = 'memo_read';
  public readonly description = 'Read a memo by name.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The memo name (txt file name)' }
    },
    required: ['name']
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) {
    super();
  }

  async execute(args: { name: string }): Promise<string> {
    try {
      const app = new MemoApp(this.workspace, this.allowedDirs);
      return app.readMemo(args.name);
    } catch (e) {
      return `Error reading memo: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 写入备忘录工具
 */
export class MemoWriteTool extends Tool {
  public readonly name = 'memo_write';
  public readonly description = 'Write a memo. If name is provided, overwrite the memo; otherwise create a new one.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Optional memo name (txt file name). If omitted, a new memo is created.' },
      content: { type: 'string', description: 'Memo content (required)' }
    },
    required: ['content']
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) {
    super();
  }

  async execute(args: { name?: string; content: string }): Promise<string> {
    try {
      const app = new MemoApp(this.workspace, this.allowedDirs);
      const filename = app.writeMemo({ name: args.name, content: args.content });
      return `Memo written: ${filename}`;
    } catch (e) {
      return `Error writing memo: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 追加备忘录工具
 */
export class MemoAppendTool extends Tool {
  public readonly name = 'memo_append';
  public readonly description = 'Append content to an existing memo.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Memo name (txt file name)' },
      content: { type: 'string', description: 'Content to append (required)' }
    },
    required: ['name', 'content']
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) {
    super();
  }

  async execute(args: { name: string; content: string }): Promise<string> {
    try {
      const app = new MemoApp(this.workspace, this.allowedDirs);
      const filename = app.appendMemo({ name: args.name, content: args.content });
      return `Memo appended: ${filename}`;
    } catch (e) {
      return `Error appending memo: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 删除备忘录工具
 */
export class MemoDeleteTool extends Tool {
  public readonly name = 'memo_delete';
  public readonly description = 'Delete a memo by name.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Memo name (txt file name)' }
    },
    required: ['name']
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) {
    super();
  }

  async execute(args: { name: string }): Promise<string> {
    try {
      const app = new MemoApp(this.workspace, this.allowedDirs);
      const filename = app.deleteMemo(args.name);
      return `Memo deleted: ${filename}`;
    } catch (e) {
      return `Error deleting memo: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 列出备忘录工具
 */
export class MemoListTool extends Tool {
  public readonly name = 'memo_list';
  public readonly description = 'List all memo file names.';
  public readonly parameters = {
    type: 'object',
    properties: {},
    required: []
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) {
    super();
  }

  async execute(): Promise<string> {
    try {
      const app = new MemoApp(this.workspace, this.allowedDirs);
      const items = app.listMemos();
      return items.length > 0 ? items.join('\n') : 'No memos found';
    } catch (e) {
      return `Error listing memos: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
