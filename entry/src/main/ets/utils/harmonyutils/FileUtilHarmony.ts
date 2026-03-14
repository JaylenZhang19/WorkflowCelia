import type { FileUtilAdapter } from '../FileUtilAdapter';

function tryLoadHarmonyFsWithRequire(): any | null {
  try {
    const g: any = globalThis as any;
    const req = g?.require;
    if (typeof req === 'function') {
      return req('@ohos.file.fs');
    }
  } catch {
    return null;
  }
  return null;
}

export class HarmonyFileUtilAdapter implements FileUtilAdapter {
  private fs: any;

  private constructor(fs: any) {
    this.fs = fs;
  }

  static async create(): Promise<HarmonyFileUtilAdapter> {
    const fs: any = tryLoadHarmonyFsWithRequire() ?? (await import('@ohos.file.fs'));
    return new HarmonyFileUtilAdapter(fs);
  }

  async exists(path: string): Promise<boolean> {
    try {
      return !!this.fs.accessSync(path);
    } catch {
      return false;
    }
  }

  async isFile(path: string): Promise<boolean> {
    try {
      return this.fs.statSync(path).isFile();
    } catch {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    try {
      return this.fs.statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  async readTextFile(path: string): Promise<string> {
    return this.fs.readTextSync(path);
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    const file = this.fs.openSync(
      filePath,
      this.fs.OpenMode.READ_WRITE | this.fs.OpenMode.CREATE | this.fs.OpenMode.TRUNC
    );
    try {
      this.fs.writeSync(file.fd, content);
    } finally {
      this.fs.closeSync(file);
    }
  }

  async mkdirp(path: string): Promise<void> {
    this.fs.mkdirSync(path, true);
  }

  async listDir(path: string): Promise<string[]> {
    return this.fs.listFileSync(path);
  }
}
