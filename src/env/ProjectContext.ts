import path from 'path';

export interface ModelConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

export interface AgentConfig {
  workDir: string;
  skillsDir: string;
  allowedDir?: string | null;
  maxSteps?: number;
  restrictToWorkspace?: boolean;
}

export interface ProjectConfig {
  model: ModelConfig;
  agent: AgentConfig;
}

export interface ProjectPaths {
  projectRoot: string;
  configPath: string;
  agentWorkDir: string;
  skillsDir: string;
  allowedDir: string | null;
}

export class ProjectContext {
  private static instance: ProjectContext | null = null;

  public readonly config: ProjectConfig;
  public readonly paths: ProjectPaths;

  private constructor(config: ProjectConfig, paths: ProjectPaths) {
    this.config = config;
    this.paths = paths;
  }

  public static init(params: { projectRoot: string; configPath: string; config: ProjectConfig }): ProjectContext {
    const projectRootAbs = path.resolve(params.projectRoot);
    const configPathAbs = path.resolve(params.configPath);
    const configDir = path.dirname(configPathAbs);

    const agentWorkDirAbs = path.resolve(configDir, params.config.agent.workDir);
    const skillsDirAbs = path.resolve(configDir, params.config.agent.skillsDir);
    const allowedDirAbs = params.config.agent.allowedDir
      ? path.resolve(configDir, params.config.agent.allowedDir)
      : null;

    const pathsObj: ProjectPaths = {
      projectRoot: projectRootAbs,
      configPath: configPathAbs,
      agentWorkDir: agentWorkDirAbs,
      skillsDir: skillsDirAbs,
      allowedDir: allowedDirAbs
    };

    ProjectContext.instance = new ProjectContext(params.config, pathsObj);
    return ProjectContext.instance;
  }

  public static getInstance(): ProjectContext {
    if (!ProjectContext.instance) {
      throw new Error('ProjectContext is not initialized. Call ProjectContext.init() first.');
    }
    return ProjectContext.instance;
  }
}

