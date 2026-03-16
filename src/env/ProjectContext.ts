import path from 'path';

export interface ModelConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

export interface AgentConfig {
  workDir: string;
  skillsDir: string;
  allowedDir?: string[] | null;
  maxSteps?: number;
  restrictToWorkspace?: boolean;
  heartbeatInterval?: number;
}

export interface ProjectConfig {
  model: ModelConfig;
  agent: AgentConfig;
}

export interface ProjectPaths {
  projectRoot: string;
  configPath: string;
  toolsConfigPath: string;
  agentWorkDir: string;
  skillsDir: string;
  allowedDirs: string[] | null;
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
    const toolsConfigPathAbs = path.resolve(configDir, 'tools.json');

    const agentWorkDirAbs = path.resolve(configDir, params.config.agent.workDir);
    const skillsDirAbs = path.resolve(configDir, params.config.agent.skillsDir);
    const allowedDirsAbs = params.config.agent.allowedDir
      ? params.config.agent.allowedDir.map((dir) => path.resolve(configDir, dir))
      : null;

    const pathsObj: ProjectPaths = {
      projectRoot: projectRootAbs,
      configPath: configPathAbs,
      toolsConfigPath: toolsConfigPathAbs,
      agentWorkDir: agentWorkDirAbs,
      skillsDir: skillsDirAbs,
      allowedDirs: allowedDirsAbs
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
