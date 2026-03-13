export type RuntimeEnv = 'harmony' | 'node' | 'unknown';

export interface ModelConfig {
  apiKey: string;
  apiUrl: string;
  modelName: string;
}

export interface ProjectConfig {
  model: ModelConfig;
}

const DEFAULT_CONFIG: ProjectConfig = {
  model: {
    apiKey: '',
    apiUrl: '',
    modelName: 'Qwen2-72B-Instruct-GPTQ-Int4'
  }
};

function isNodeRuntime(): boolean {
  const g: any = globalThis as any;
  return !!(g?.process?.versions?.node);
}

function isHarmonyRuntime(): boolean {
  const g: any = globalThis as any;
  return !!(g?.ohos || g?.ArkUI || g?.AbilityStage || g?.Ability);
}

export function detectRuntime(): RuntimeEnv {
  if (isNodeRuntime()) return 'node';
  if (isHarmonyRuntime()) return 'harmony';
  return 'unknown';
}

export function mergeConfig(base: ProjectConfig, patch?: Partial<ProjectConfig>): ProjectConfig {
  if (!patch) return base;
  return {
    model: {
      apiKey: patch.model?.apiKey ?? base.model.apiKey,
      apiUrl: patch.model?.apiUrl ?? base.model.apiUrl,
      modelName: patch.model?.modelName ?? base.model.modelName
    }
  };
}

export class ProjectContext {
  private static instance: ProjectContext | null = null;

  readonly runtime: RuntimeEnv;
  readonly config: ProjectConfig;
  readonly configSource: string;

  private constructor(runtime: RuntimeEnv, config: ProjectConfig, configSource: string) {
    this.runtime = runtime;
    this.config = config;
    this.configSource = configSource;
  }

  static init(params: {
    runtime?: RuntimeEnv;
    config?: Partial<ProjectConfig>;
    configSource?: string;
  } = {}): ProjectContext {
    if (ProjectContext.instance) {
      return ProjectContext.instance;
    }
    const runtime = params.runtime ?? detectRuntime();
    const config = mergeConfig(DEFAULT_CONFIG, params.config);
    const source = params.configSource ?? 'default';
    ProjectContext.instance = new ProjectContext(runtime, config, source);
    return ProjectContext.instance;
  }

  static getInstance(): ProjectContext {
    if (!ProjectContext.instance) {
      throw new Error('ProjectContext is not initialized');
    }
    return ProjectContext.instance;
  }

  static getInstanceOptional(): ProjectContext | null {
    return ProjectContext.instance;
  }

  static resetForTest(): void {
    ProjectContext.instance = null;
  }

  isNode(): boolean {
    return this.runtime === 'node';
  }

  isHarmony(): boolean {
    return this.runtime === 'harmony';
  }
}
