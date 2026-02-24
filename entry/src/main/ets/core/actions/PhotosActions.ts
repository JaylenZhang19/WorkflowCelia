/**
 * Photos Actions
 * Using providers for photo capabilities
 */
import { PhotosProvider } from '..';
import { ActionDefinition, ActionExecutor, ActionResult, createActionDefinition, IWorkflowContext } from '../models/Action';
import { DataType } from '../models/DataType';


export class GetLatestPhotosAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_latest_photos',
      name: 'Get Latest Photos',
      description: 'Get the most recently saved photos from the photo library',
      category: 'photos',
      inputs: [
        { name: 'count', type: DataType.NUMBER, required: false, default: 1, description: 'Number of photos to retrieve' }
      ],
      outputs: [{ name: 'photos', type: DataType.IMAGE, required: true, isArray: true, description: 'Array of photo objects' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = PhotosProvider.getInstance();
      const count = inputs.count || 1;
      const photos = await provider.getLatestPhotos(count);
      
      context.log('info', `Retrieved ${photos.length} photos`);
      return { success: true, outputs: { photos } };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get photos: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class GetPhotosFromAlbumAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'get_photos_from_album',
      name: 'Get Photos From Album',
      description: 'Get all photos from a specific album',
      category: 'photos',
      inputs: [
        { name: 'albumName', type: DataType.TEXT, required: true, description: 'Name of the album' }
      ],
      outputs: [{ name: 'photos', type: DataType.IMAGE, required: true, isArray: true, description: 'Array of photo objects' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = PhotosProvider.getInstance();
      const albumName = inputs.albumName;
      
      if (!albumName) {
        return { success: false, error: 'Album name is required' };
      }
      
      const photos = await provider.getPhotosFromAlbum(albumName);
      context.log('info', `Retrieved ${photos.length} photos from album "${albumName}"`);
      
      return { success: true, outputs: { photos } };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get photos: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export class SaveToAlbumAction implements ActionExecutor {
  private definition: ActionDefinition;

  constructor() {
    this.definition = createActionDefinition({
      id: 'save_to_album',
      name: 'Save To Album',
      description: 'Save photos or videos to a specific album',
      category: 'photos',
      inputs: [
        { name: 'photo', type: DataType.IMAGE, required: true, description: 'Photo to save' },
        { name: 'albumName', type: DataType.TEXT, required: false, default: 'Recents', description: 'Album name' }
      ],
      outputs: [{ name: 'savedPhoto', type: DataType.IMAGE, required: true, description: 'The saved photo' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    try {
      const provider = PhotosProvider.getInstance();
      const albumName = inputs.albumName || 'Recents';
      const photo = inputs.photo || {};
      
      const savedPhoto = await provider.saveToAlbum(photo, albumName);
      context.log('info', `Saved photo to album "${albumName}"`);
      
      return { success: true, outputs: { savedPhoto } };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save photo: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const PHOTOS_ACTIONS = [
  GetLatestPhotosAction,
  GetPhotosFromAlbumAction,
  SaveToAlbumAction
];
