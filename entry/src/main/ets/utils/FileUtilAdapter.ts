export interface FileUtilAdapter {
  exists(path: string): Promise<boolean>;
  isFile(path: string): Promise<boolean>;
  isDirectory(path: string): Promise<boolean>;
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  mkdirp(path: string): Promise<void>;
  listDir(path: string): Promise<string[]>;
}

