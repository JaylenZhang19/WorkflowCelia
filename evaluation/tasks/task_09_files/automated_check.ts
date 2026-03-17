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
    src_directory: 0.0,
    main_py_created: 0.0,
    main_py_valid: 0.0,
    readme_created: 0.0,
    readme_has_title: 0.0,
    gitignore_created: 0.0,
    gitignore_has_pycache: 0.0,
  };

  const srcDir = path.join(ctx.workspaceDir, "src");
  if (await existsDir(srcDir)) {
    scores.src_directory = 1.0;
  }

  const mainPy = path.join(srcDir, "main.py");
  let mainContent = "";
  try {
    mainContent = await fs.readFile(mainPy, "utf-8");
    scores.main_py_created = 1.0;
    const hasHello = /print\s*\(\s*["']hello/i.test(mainContent);
    const hasPrint = /print\s*\(/i.test(mainContent);
    if (hasHello) {
      scores.main_py_valid = 1.0;
    } else if (hasPrint) {
      scores.main_py_valid = 0.5;
    }
  } catch {
    // noop
  }

  const readme = path.join(ctx.workspaceDir, "README.md");
  try {
    const content = await fs.readFile(readme, "utf-8");
    scores.readme_created = 1.0;
    const hasTitle =
      /^#\s+\w+/m.test(content) || /^[A-Z][\w\s]{3,}$/m.test(content) || content.trim().length > 5;
    scores.readme_has_title = hasTitle ? 1.0 : 0.5;
  } catch {
    // noop
  }

  const gitignore = path.join(ctx.workspaceDir, ".gitignore");
  try {
    const content = await fs.readFile(gitignore, "utf-8");
    scores.gitignore_created = 1.0;
    scores.gitignore_has_pycache = content.includes("__pycache__") ? 1.0 : 0.0;
  } catch {
    // noop
  }

  return { scores, total: averageScore(scores) };
}

async function existsDir(target: string): Promise<boolean> {
  try {
    const stat = await fs.stat(target);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

