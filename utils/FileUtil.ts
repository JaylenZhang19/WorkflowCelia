import fs from 'fs';

export class FileUtil {
  public static exists(path: string): boolean {
    return fs.existsSync(path);
  }

  public static isFile(path: string): boolean {
    try {
      return fs.statSync(path).isFile();
    } catch {
      return false;
    }
  }

  public static isDirectory(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  public static readTextFile(path: string): string {
    return fs.readFileSync(path, 'utf-8');
  }

  public static writeTextFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  public static mkdirp(path: string): void {
    fs.mkdirSync(path, { recursive: true });
  }

  public static listDir(path: string): string[] {
    return fs.readdirSync(path);
  }
}