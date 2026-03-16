import fs from 'fs';
import path from 'path';
import { ProjectConfig } from '../env/ProjectContext';

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid config field '${field}': expected a non-empty string`);
  }
}

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid config field '${field}': expected an object`);
  }
  return value as Record<string, unknown>;
}

function parseAllowedDirs(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    const dirs = value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
    return dirs.length > 0 ? dirs : null;
  }
  const single = String(value).trim();
  return single.length > 0 ? [single] : null;
}

export function loadProjectConfig(configPath: string): ProjectConfig {
  const absPath = path.resolve(configPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Config file not found: ${absPath}`);
  }

  const raw = fs.readFileSync(absPath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse config JSON: ${absPath}`);
  }

  const root = asObject(parsed, 'root');
  const model = asObject(root.model, 'model');
  const agent = asObject(root.agent, 'agent');

  assertNonEmptyString(model.apiUrl, 'model.apiUrl');
  assertNonEmptyString(model.apiKey, 'model.apiKey');
  assertNonEmptyString(model.modelName, 'model.modelName');

  assertNonEmptyString(agent.workDir, 'agent.workDir');
  assertNonEmptyString(agent.skillsDir, 'agent.skillsDir');

  const allowedDir = parseAllowedDirs(agent.allowedDir);
  const maxSteps = agent.maxSteps == null ? 20 : Number(agent.maxSteps);
  const restrictToWorkspace = agent.restrictToWorkspace == null ? true : Boolean(agent.restrictToWorkspace);
  const heartbeatInterval = agent.heartbeatInterval == null ? 30 : Number(agent.heartbeatInterval);
  const resetHistoryOnFinish = agent.resetHistoryOnFinish == null ? true : Boolean(agent.resetHistoryOnFinish);

  return {
    model: {
      apiUrl: String(model.apiUrl),
      apiKey: String(model.apiKey),
      modelName: String(model.modelName)
    },
    agent: {
      workDir: String(agent.workDir),
      skillsDir: String(agent.skillsDir),
      allowedDir,
      maxSteps: Number.isFinite(maxSteps) && maxSteps > 0 ? maxSteps : 20,
      restrictToWorkspace,
      heartbeatInterval: Number.isFinite(heartbeatInterval) && heartbeatInterval > 0 ? heartbeatInterval : 30,
      resetHistoryOnFinish
    }
  };
}
