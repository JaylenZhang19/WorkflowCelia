import fs from 'fs';
import path from 'path';

export interface ToolConfigItem {
  name: string;
  enabled: boolean;
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
    return { tools: [] };
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
    return { tools: [] };
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
    return { name, enabled };
  });

  return { tools };
}
