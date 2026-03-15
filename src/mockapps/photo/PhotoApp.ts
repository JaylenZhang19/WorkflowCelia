import { FileUtil } from '../../utils';
import { ProjectContext } from '../../env/ProjectContext';

export interface PhotoSaveParams {
  name?: string;
  content: string;
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
    
    const allowedDir = context.paths.allowedDir;
    if (allowedDir && !dir.startsWith(allowedDir)) {
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

  public savePhoto(params: PhotoSaveParams): string {
    const content = params.content?.trim();
    if (!content) {
      throw new Error('Photo content is required.');
    }
    const dir = this.getStorageDir();
    const filename = this.normalizeName(params.name);
    const filePath = `${dir}/${filename}`;
    FileUtil.writeTextFile(filePath, content);
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
