import path from 'path';
import { Tool } from './BaseTool';
import { FileUtil, isPathAllowed } from '../../utils';

function resolvePath(pathStr: string, workspace: string | null, allowedDirs: string[] | null): string {
  let p = pathStr;

  // 1. 处理相对路径
  if (!path.isAbsolute(p) && workspace) {
    p = path.join(workspace, p);
  }

  // 2. 规范化路径
  // 注意：实际开发中建议对 ../ 进行过滤以防路径穿越攻击
  if (p.includes('..')) {
    throw new Error("Path contains '..' which is restricted for security.");
  }
  p = path.resolve(p);

  // 3. 权限范围检查
  if (!isPathAllowed(p, allowedDirs)) {
    throw new Error(`Permission Denied: Path ${pathStr} is outside allowed directory.`);
  }

  return p;
}

/**
 * 读取文件工具
 */
export class ReadFileTool extends Tool {
  public readonly name = "read_file";
  public readonly description = "Read the contents of a file at the given path.";
  public readonly parameters = {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "The file path to read" }
    },
    "required": ["path"]
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) { super(); }

  async execute(args: { path: string }): Promise<string> {
    try {
      const filePath = resolvePath(args.path, this.workspace, this.allowedDirs);

      if (!FileUtil.exists(filePath)) return `Error: File not found: ${args.path}`;

      if (!FileUtil.isFile(filePath)) return `Error: Not a file: ${args.path}`;

      // 读取内容 (UTF-8)
      return FileUtil.readTextFile(filePath);
    } catch (e) {
      return `Error reading file: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 写入文件工具
 */
export class WriteFileTool extends Tool {
  public readonly name = "write_file";
  public readonly description = "Write content to a file at the given path. Creates parent directories if needed.";
  public readonly parameters = {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "The file path to write to" },
      "content": { "type": "string", "description": "The content to write" }
    },
    "required": ["path", "content"]
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) { super(); }

  async execute(args: { path: string, content: string }): Promise<string> {
    try {
      const filePath = resolvePath(args.path, this.workspace, this.allowedDirs);

      // 提取父目录路径
      const lastSlashIndex = filePath.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const parentDir = filePath.substring(0, lastSlashIndex);
        if (!FileUtil.exists(parentDir)) {
          FileUtil.mkdirp(parentDir);
        }
      }

      // 写入文件 (覆盖模式)
      FileUtil.writeTextFile(filePath, args.content);

      return `Successfully wrote ${args.content.length} characters to ${args.path}`;
    } catch (e) {
      return `Error writing file: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 编辑文件工具 (文本替换)
 */
export class EditFileTool extends Tool {
  public readonly name = "edit_file";
  public readonly description = "Edit a file by replacing old_text with new_text. The old_text must exist exactly in the file.";
  public readonly parameters = {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "The file path to edit" },
      "old_text": { "type": "string", "description": "The exact text to find and replace" },
      "new_text": { "type": "string", "description": "The text to replace with" }
    },
    "required": ["path", "old_text", "new_text"]
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) { super(); }

  async execute(args: { path: string, old_text: string, new_text: string }): Promise<string> {
    try {
      const filePath = resolvePath(args.path, this.workspace, this.allowedDirs);
      if (!FileUtil.exists(filePath)) return `Error: File not found: ${args.path}`;

      let content = FileUtil.readTextFile(filePath);

      if (!content.includes(args.old_text)) {
        return `Error: old_text not found in ${args.path}. Verify the content exactly.`;
      }

      // 检查唯一性
      const occurrences = content.split(args.old_text).length - 1;
      if (occurrences > 1) {
        return `Warning: old_text appears ${occurrences} times. Provide more context to make it unique.`;
      }

      const newContent = content.replace(args.old_text, args.new_text);
      FileUtil.writeTextFile(filePath, newContent)

      return `Successfully edited ${args.path}`;
    } catch (e) {
      return `Error editing file: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * 列出目录工具
 */
export class ListDirTool extends Tool {
  public readonly name = "list_dir";
  public readonly description = "List the contents of a directory.";
  public readonly parameters = {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "The directory path to list" }
    },
    "required": ["path"]
  };

  constructor(private workspace: string | null, private allowedDirs: string[] | null) { super(); }

  async execute(args: { path: string }): Promise<string> {
    try {
      const dirPath = resolvePath(args.path, this.workspace, this.allowedDirs);

      if (!FileUtil.exists(dirPath)) return `Error: Directory not found: ${args.path}`;
      if (!FileUtil.isDirectory(dirPath)) return `Error: Not a directory: ${args.path}`;

      const filenames = FileUtil.listDir(dirPath);
      const items = filenames.map(name => {
        const fullPath = `${dirPath}/${name}`;
        const isDir = FileUtil.isDirectory(fullPath);
        return `${isDir ? '📁' : '📄'} ${name}`;
      });

      return items.length > 0 ? items.sort().join('\n') : `Directory ${args.path} is empty`;
    } catch (e) {
      return `Error listing directory: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
