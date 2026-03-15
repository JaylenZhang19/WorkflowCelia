import { Tool } from './BaseTool';
import { PhotoApp } from '../../mockapps/photo/PhotoApp';

/**
 * Tool for saving a photo
 */
export class PhotoSaveTool extends Tool {
  public readonly name = 'photo_save';
  public readonly description = 'Save a photo. If name is provided, save with that name; otherwise create a new one.';
  public readonly parameters = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Optional photo name (png file name). If omitted, a new photo name is generated.' },
      content: { type: 'string', description: 'Photo content (required base64 or placeholder text)' }
    },
    required: ['content']
  };

  constructor(private workspace: string | null, private allowedDir: string | null) {
    super();
  }

  async execute(args: { name?: string; content: string }): Promise<string> {
    try {
      const app = new PhotoApp();
      const filename = app.savePhoto({ name: args.name, content: args.content });
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
