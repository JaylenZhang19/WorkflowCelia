import fs from 'fs';
import path from 'path';
import { ProjectContext, ProjectConfig } from './entry/src/main/ets/env/ProjectContext';

function readConfigFile(filePath: string): Partial<ProjectConfig> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ProjectConfig;
  } catch {
    return null;
  }
}

function resolveConfigPath(): string {
  if (process.env.WORKFLOW_CELIA_CONFIG) {
    return path.resolve(process.env.WORKFLOW_CELIA_CONFIG);
  }
  return path.resolve(process.cwd(), 'app_config.json');
}

const configPath = resolveConfigPath();
const fileConfig = readConfigFile(configPath);

ProjectContext.init({
  runtime: 'node',
  config: fileConfig || undefined,
  configSource: fileConfig ? configPath : 'default'
});

console.log(`ProjectContext initialized for node. configSource=${ProjectContext.getInstance().configSource}`);
