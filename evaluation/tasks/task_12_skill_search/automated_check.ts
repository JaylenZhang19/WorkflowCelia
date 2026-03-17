import fs from "node:fs/promises";
import path from "node:path";
import { GradeContext, GradeResult } from "../../types";

function averageScore(scores: Record<string, number>): number {
  const values = Object.values(scores).filter((v) => Number.isFinite(v));
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export async function grade(ctx: GradeContext): Promise<GradeResult> {
  const scores: Record<string, number> = {
    settings_host_updated: 0.0,
    settings_db_updated: 0.0,
    settings_loglevel_updated: 0.0,
    settings_api_updated: 0.0,
    yaml_host_updated: 0.0,
    yaml_db_updated: 0.0,
  };

  const settingsFile = path.join(ctx.workspaceDir, "config", "settings.json");
  try {
    const content = await fs.readFile(settingsFile, "utf-8");
    const sanitized = content.replace("api.example.com", "");
    scores.settings_host_updated =
      content.includes("prod-db.example.com") && !sanitized.includes("localhost") ? 1.0 : 0.0;
    scores.settings_db_updated = content.includes("myapp_prod") && !content.includes("myapp_dev") ? 1.0 : 0.0;
    scores.settings_loglevel_updated =
      content.toLowerCase().includes("\"warn\"") && !content.toLowerCase().includes("\"debug\"") ? 1.0 : 0.0;
    scores.settings_api_updated = content.includes("https://api.example.com") ? 1.0 : 0.0;
  } catch {
    // noop
  }

  const dbFile = path.join(ctx.workspaceDir, "config", "database.yml");
  try {
    const content = await fs.readFile(dbFile, "utf-8");
    scores.yaml_host_updated = content.includes("prod-db.example.com") && !content.includes("localhost") ? 1.0 : 0.0;
    scores.yaml_db_updated =
      content.includes("myapp_prod") && !content.includes("myapp_dev") && !content.includes("myapp_test") ? 1.0 : 0.0;
  } catch {
    // noop
  }

  return { scores, total: averageScore(scores) };
}

