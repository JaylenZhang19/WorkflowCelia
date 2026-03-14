import type { FileUtilAdapter } from '../FileUtilAdapter';

async function loadNodeFs(): Promise<any> {
  try {
    return await import('node:fs');
  } catch {
    return await import('fs');
  }
}

export class NodeFileUtilAdapter implements FileUtilAdapter {
  private fs: any;

  private constructor(fs: any) {
    this.fs = fs;
  }

  static async create(): Promise<NodeFileUtilAdapter> {
    const fs: any = await loadNodeFs();
    return new NodeFileUtilAdapter(fs);
  }

  async exists(path: string): Promise<boolean> {
    return this.fs.existsSync(path);
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
    return this.fs.readFileSync(path, 'utf-8');
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    this.fs.writeFileSync(filePath, content, 'utf-8');
  }

  async mkdirp(path: string): Promise<void> {
    this.fs.mkdirSync(path, { recursive: true });
  }

  async listDir(path: string): Promise<string[]> {
    return this.fs.readdirSync(path);
  }
}
