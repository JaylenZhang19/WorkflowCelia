/**
 * Photos Actions
 */
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
    const { count = 1 } = inputs;
    const photos = [];
    for (let i = 0; i < count; i++) {
      photos.push({
        id: `photo_${Date.now()}_${i}`,
        filename: `photo_${i}.jpg`,
        width: 1920,
        height: 1080,
        dateTaken: Date.now() - i * 3600000,
        location: { latitude: 40.7128, longitude: -74.0060 },
        album: 'Recents'
      });
    }
    context.log('info', `Retrieved ${photos.length} photos`);
    return { success: true, outputs: { photos } };
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
        { name: 'media', type: DataType.IMAGE, required: true, isArray: true, description: 'Media to save' },
        { name: 'albumName', type: DataType.TEXT, required: false, default: 'Recents', description: 'Album name' }
      ],
      outputs: [{ name: 'savedCount', type: DataType.NUMBER, required: true, description: 'Number of items saved' }],
      version: '1.0.0'
    });
  }

  getDefinition(): ActionDefinition {
    return this.definition;
  }

  async execute(inputs: Record<string, any>, context: IWorkflowContext): Promise<ActionResult> {
    const { media = [], albumName = 'Recents' } = inputs;
    if (!Array.isArray(media)) {
      return { success: false, error: 'Input must be an array of media' };
    }
    context.log('info', `Saving ${media.length} items to album '${albumName}'`);
    return { success: true, outputs: { savedCount: media.length } };
  }
}

export const PHOTOS_ACTIONS = [
  GetLatestPhotosAction,
  SaveToAlbumAction
];
