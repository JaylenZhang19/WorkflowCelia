import { common } from '@kit.AbilityKit';
import { logger } from '../utils/Logger';
import { ProjectContext, ProjectConfig, mergeConfig } from './ProjectContext';

const TAG = 'ProjectContext';

function decodeToString(data: ArrayBuffer | Uint8Array): string {
  const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
  let text = '';
  for (let i = 0; i < arr.length; i++) {
    text += String.fromCharCode(arr[i]);
  }
  return text;
}

async function loadRawfileConfig(context: common.UIAbilityContext): Promise<Partial<ProjectConfig> | null> {
  try {
    const raw = await context.resourceManager.getRawFileContent('app_config.json');
    const text = decodeToString(raw);
    return JSON.parse(text) as ProjectConfig;
  } catch (err) {
    logger.warn(TAG, `Failed to load app_config.json: ${JSON.stringify(err)}`);
    return null;
  }
}

export async function initProjectContextForHarmony(
  context: common.UIAbilityContext,
  overrides?: Partial<ProjectConfig>
): Promise<ProjectContext> {
  const existing = ProjectContext.getInstanceOptional();
  if (existing) return existing;

  const fileConfig = await loadRawfileConfig(context);
  const merged = mergeConfig(
    mergeConfig({
      model: { apiKey: '', apiUrl: '', modelName: 'Qwen2-72B-Instruct-GPTQ-Int4' }
    }, fileConfig || undefined),
    overrides
  );

  return ProjectContext.init({
    runtime: 'harmony',
    config: merged,
    configSource: fileConfig ? 'rawfile:app_config.json' : 'default'
  });
}
