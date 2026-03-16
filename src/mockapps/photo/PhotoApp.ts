import { FileUtil, isPathAllowed } from '../../utils';
import { ProjectContext } from '../../env/ProjectContext';

export interface PhotoSaveParams {
  name?: string;
  sourceUrlOrPath: string;
}

export class PhotoApp {
  constructor() {}

  private getStorageDir(): string {
    const context = ProjectContext.getInstance();
    const workspace = context.paths.agentWorkDir;
    
    if (!workspace) {
      throw new Error('Workspace is not set.');
    }
    const dir = `${workspace}/mockedapp/Photo`;
    
    const allowedDirs = context.paths.allowedDirs;
    if (!isPathAllowed(dir, allowedDirs)) {
      throw new Error('Permission Denied: Photo storage is outside allowed directory.');
    }
    if (!FileUtil.exists(dir)) {
      FileUtil.mkdirp(dir);
    }
    return dir;
  }

  private normalizeName(name?: string): string {
    const raw = (name ?? '').trim();
    if (!raw) {
      return `photo-${Date.now()}.png`;
    }
    if (raw.includes('..') || raw.includes('/') || raw.includes('\\')) {
      throw new Error('Invalid photo name.');
    }
    return raw.endsWith('.png') ? raw : `${raw}.png`;
  }

  public async savePhoto(params: PhotoSaveParams): Promise<string> {
    const source = params.sourceUrlOrPath?.trim();
    if (!source) {
      throw new Error('Photo source URL or path is required.');
    }
    const dir = this.getStorageDir();
    const filename = this.normalizeName(params.name);
    const filePath = `${dir}/${filename}`;
    
    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Download from URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch photo from URL: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      import('fs').then(fs => fs.promises.writeFile(filePath, buffer));
    } else {
      // Copy from local path
      if (!FileUtil.exists(source)) {
         throw new Error(`Local source file not found: ${source}`);
      }
      FileUtil.copyFile(source, filePath);
    }
    
    return filename;
  }

  public deletePhoto(name: string): string {
    const dir = this.getStorageDir();
    const filename = this.normalizeName(name);
    const filePath = `${dir}/${filename}`;
    if (!FileUtil.exists(filePath)) {
      throw new Error(`Photo not found: ${filename}`);
    }
    FileUtil.removeFile(filePath);
    return filename;
  }

  public retrievePhotos(): string[] {
    const dir = this.getStorageDir();
    const items = FileUtil.listDir(dir);
    return items
      .filter((name) => name.endsWith('.png'))
      .sort();
  }
}
