import fs from 'fs';
import path from 'path';

export interface ToolConfigItem {
  name: string;
  enabled: boolean;
  /**
   * Legacy fields from the previous dynamic loader. They are now optional and ignored
   * by the static tool registry, but we keep them for backward compatibility.
   */
  module?: string;
  export?: string;
}

export interface ToolsConfig {
  tools: ToolConfigItem[];
}

function asObject(value: unknown, field: string): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid tools config field '${field}': expected an object`);
  }
  return value as Record<string, any>;
}

export function loadToolsConfig(configPath: string): ToolsConfig {
  const absPath = path.resolve(configPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Tools config file not found: ${absPath}`);
  }

  const raw = fs.readFileSync(absPath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse tools config JSON: ${absPath}`);
  }

  const root: Record<string, any> = asObject(parsed, 'root');
  const toolsRaw = root.tools;
  if (toolsRaw == null) {
    throw new Error("Invalid tools config: missing field 'tools'");
  }
  if (!Array.isArray(toolsRaw)) {
    throw new Error("Invalid tools config field 'tools': expected an array of {name, enabled}");
  }

  const tools: ToolConfigItem[] = toolsRaw.map((item, idx) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Invalid tools config item at index ${idx}: expected an object`);
    }
    const obj = item as Record<string, unknown>;
    const name = String(obj.name ?? '').trim();
    if (!name) {
      throw new Error(`Invalid tools config item at index ${idx}: missing 'name'`);
    }
    const enabled = Boolean(obj.enabled);

    const modulePathRaw = obj.module;
    const exportNameRaw = obj.export;
    const modulePath =
      typeof modulePathRaw === 'string' && modulePathRaw.trim() ? modulePathRaw.trim() : undefined;
    const exportName =
      typeof exportNameRaw === 'string' && exportNameRaw.trim() ? exportNameRaw.trim() : undefined;

    return { name, enabled, module: modulePath, export: exportName };
  });

  return { tools };
}
