import fs from '@ohos.file.fs';
import { Tool } from './BaseTool';

/**
 * 路径解析与安全检查
 * 鸿蒙沙箱路径通常以 /data/storage/el2/base/files 开头
 */
function resolvePath(pathStr: string, workspace: string | null, allowedDir: string | null): string {
  let p = pathStr;

  // 1. 处理相对路径
  if (!p.startsWith('/') && workspace) {
    p = `${workspace}/${p}`;
  }

  // 2. 规范化路径 (简单处理，鸿蒙 fs 目前缺少复杂的 Path.resolve)
  // 注意：实际开发中建议对 ../ 进行过滤以防路径穿越攻击
  if (p.includes('..')) {
    throw new Error("Path contains '..' which is restricted for security.");
  }

  // 3. 权限范围检查
  if (allowedDir && !p.startsWith(allowedDir)) {
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

  constructor(private workspace: string | null, private allowedDir: string | null) { super(); }

  async execute(args: { path: string }): Promise<string> {
    try {
      const filePath = resolvePath(args.path, this.workspace, this.allowedDir);

      if (!fs.accessSync(filePath)) return `Error: File not found: ${args.path}`;

      let stat = fs.statSync(filePath);
      if (!stat.isFile()) return `Error: Not a file: ${args.path}`;

      // 读取内容 (UTF-8)
      return fs.readTextSync(filePath);
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

  constructor(private workspace: string | null, private allowedDir: string | null) { super(); }

  async execute(args: { path: string, content: string }): Promise<string> {
    try {
      const filePath = resolvePath(args.path, this.workspace, this.allowedDir);

      // 提取父目录路径
      const lastSlashIndex = filePath.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const parentDir = filePath.substring(0, lastSlashIndex);
        // 使用原生递归创建目录能力 (API 10/11+)
        if (!fs.accessSync(parentDir)) {
          fs.mkdirSync(parentDir, true);
        }
      }

      // 写入文件 (覆盖模式)
      const file = fs.openSync(filePath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE | fs.OpenMode.TRUNC);
      fs.writeSync(file.fd, args.content);
      fs.closeSync(file);

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

  constructor(private workspace: string | null, private allowedDir: string | null) { super(); }

  async execute(args: { path: string, old_text: string, new_text: string }): Promise<string> {
    try {
      const filePath = resolvePath(args.path, this.workspace, this.allowedDir);
      if (!fs.accessSync(filePath)) return `Error: File not found: ${args.path}`;

      let content = fs.readTextSync(filePath);

      if (!content.includes(args.old_text)) {
        return `Error: old_text not found in ${args.path}. Verify the content exactly.`;
      }

      // 检查唯一性
      const occurrences = content.split(args.old_text).length - 1;
      if (occurrences > 1) {
        return `Warning: old_text appears ${occurrences} times. Provide more context to make it unique.`;
      }

      const newContent = content.replace(args.old_text, args.new_text);

      const file = fs.openSync(filePath, fs.OpenMode.READ_WRITE | fs.OpenMode.TRUNC);
      fs.writeSync(file.fd, newContent);
      fs.closeSync(file);

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

  constructor(private workspace: string | null, private allowedDir: string | null) { super(); }

  async execute(args: { path: string }): Promise<string> {
    try {
      const dirPath = resolvePath(args.path, this.workspace, this.allowedDir);

      if (!fs.accessSync(dirPath)) return `Error: Directory not found: ${args.path}`;
      let stat = fs.statSync(dirPath);
      if (!stat.isDirectory()) return `Error: Not a directory: ${args.path}`;

      const filenames = fs.listFileSync(dirPath);
      const items = filenames.map(name => {
        const fullPath = `${dirPath}/${name}`;
        const isDir = fs.statSync(fullPath).isDirectory();
        return `${isDir ? '📁' : '📄'} ${name}`;
      });

      return items.length > 0 ? items.sort().join('\n') : `Directory ${args.path} is empty`;
    } catch (e) {
      return `Error listing directory: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}