import { Tool } from './BaseTool';
import { PhotoApp } from '../../mockapps/photo/PhotoApp';

/**
 * Tool for saving a photo
 */
export class PhotoSaveTool extends Tool {
  public readonly name = 'photo_save';
  public readonly description = 'Save a photo by downloading from a URL or copying from a local file path. If name is provided, save with that name; otherwise create a new one.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Optional photo name (png file name). If omitted, a new photo name is generated.' },
      sourceUrlOrPath: { type: 'string', description: 'Photo source URL (http/https) or local absolute file path (required)' }
    },
    required: ['sourceUrlOrPath']
  };

  constructor(private workspace: string | null, private allowedDir: string | null) {
    super();
  }

  async execute(args: { name?: string; sourceUrlOrPath: string }): Promise<string> {
    try {
      const app = new PhotoApp();
      const filename = await app.savePhoto({ name: args.name, sourceUrlOrPath: args.sourceUrlOrPath });
      return `Photo saved: ${filename}`;
    } catch (e) {
      return `Error saving photo: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for retrieving a list of photos
 */
export class PhotoRetrieveTool extends Tool {
  public readonly name = 'photo_retrieve';
  public readonly description = 'List all photo file names.';
  public readonly parameters = {
    type: 'object',
    properties: {},
    required: []
  };

  constructor(private workspace: string | null, private allowedDir: string | null) {
    super();
  }

  async execute(): Promise<string> {
    try {
      const app = new PhotoApp();
      const items = app.retrievePhotos();
      return items.length > 0 ? items.join('\n') : 'No photos found';
    } catch (e) {
      return `Error retrieving photos: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}

/**
 * Tool for deleting a photo
 */
export class PhotoDeleteTool extends Tool {
  public readonly name = 'photo_delete';
  public readonly description = 'Delete a photo by name.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Photo name (png file name)' }
    },
    required: ['name']
  };

  constructor() {
    super();
  }

  async execute(args: { name: string }): Promise<string> {
    try {
      const app = new PhotoApp();
      const filename = app.deletePhoto(args.name);
      return `Photo deleted: ${filename}`;
    } catch (e) {
      return `Error deleting photo: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
}
