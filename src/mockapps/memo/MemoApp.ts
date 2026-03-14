import { FileUtil } from '../../utils';

export interface MemoWriteParams {
  name?: string;
  content: string;
}

export interface MemoAppendParams {
  name: string;
  content: string;
}

export class MemoApp {
  private workspace: string | null;
  private allowedDir: string | null;

  constructor(workspace: string | null, allowedDir: string | null) {
    this.workspace = workspace;
    this.allowedDir = allowedDir;
  }

  private getStorageDir(): string {
    if (!this.workspace) {
      throw new Error('Workspace is not set.');
    }
    const dir = `${this.workspace}/mockapps/memo`;
    if (this.allowedDir && !dir.startsWith(this.allowedDir)) {
      throw new Error('Permission Denied: Memo storage is outside allowed directory.');
    }
    if (!FileUtil.exists(dir)) {
      FileUtil.mkdirp(dir);
    }
    return dir;
  }

  private normalizeName(name?: string): string {
    const raw = (name ?? '').trim();
    if (!raw) {
      return `memo-${Date.now()}.txt`;
    }
    if (raw.includes('..') || raw.includes('/') || raw.includes('\\')) {
      throw new Error('Invalid memo name.');
    }
    return raw.endsWith('.txt') ? raw : `${raw}.txt`;
  }

  public writeMemo(params: MemoWriteParams): string {
    const content = params.content?.trim();
    if (!content) {
      throw new Error('Memo content is required.');
    }
    const dir = this.getStorageDir();
    const filename = this.normalizeName(params.name);
    const filePath = `${dir}/${filename}`;
    FileUtil.writeTextFile(filePath, content);
    return filename;
  }

  public appendMemo(params: MemoAppendParams): string {
    const content = params.content?.trim();
    if (!content) {
      throw new Error('Memo content is required.');
    }
    const dir = this.getStorageDir();
    const filename = this.normalizeName(params.name);
    const filePath = `${dir}/${filename}`;
    if (!FileUtil.exists(filePath)) {
      throw new Error(`Memo not found: ${filename}`);
    }
    if (!FileUtil.isFile(filePath)) {
      throw new Error(`Not a memo file: ${filename}`);
    }
    const existing = FileUtil.readTextFile(filePath);
    const next = existing.length > 0 ? `${existing}\n${content}` : content;
    FileUtil.writeTextFile(filePath, next);
    return filename;
  }

  public readMemo(name: string): string {
    const dir = this.getStorageDir();
    const filename = this.normalizeName(name);
    const filePath = `${dir}/${filename}`;
    if (!FileUtil.exists(filePath)) {
      throw new Error(`Memo not found: ${filename}`);
    }
    if (!FileUtil.isFile(filePath)) {
      throw new Error(`Not a memo file: ${filename}`);
    }
    return FileUtil.readTextFile(filePath);
  }

  public deleteMemo(name: string): string {
    const dir = this.getStorageDir();
    const filename = this.normalizeName(name);
    const filePath = `${dir}/${filename}`;
    if (!FileUtil.exists(filePath)) {
      throw new Error(`Memo not found: ${filename}`);
    }
    if (!FileUtil.isFile(filePath)) {
      throw new Error(`Not a memo file: ${filename}`);
    }
    FileUtil.removeFile(filePath);
    return filename;
  }

  public listMemos(): string[] {
    const dir = this.getStorageDir();
    const items = FileUtil.listDir(dir);
    return items
      .filter((name) => name.endsWith('.txt'))
      .sort();
  }
}
