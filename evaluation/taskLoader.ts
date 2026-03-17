import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { Task } from "./types";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export class TaskLoader {
  constructor(private tasksDir: string) {}

  async loadAll(): Promise<Task[]> {
    const entries = await fs.readdir(this.tasksDir, { withFileTypes: true });
    const taskFiles = entries
      .flatMap((entry) => {
        const name = entry.name;
        if (!name.startsWith("task_")) {
          return [];
        }
        if (entry.isFile() && name.endsWith(".md")) {
          return [path.join(this.tasksDir, name)];
        }
        if (entry.isDirectory()) {
          return [path.join(this.tasksDir, name, `${name}.md`)];
        }
        return [];
      })
      .sort();

    const tasks: Task[] = [];
    for (const filePath of taskFiles) {
      const task = await this.loadTask(filePath);
      tasks.push(task);
    }
    return tasks;
  }

  async loadTask(filePath: string): Promise<Task> {
    const raw = await fs.readFile(filePath, "utf-8");
    const match = raw.match(FRONTMATTER_RE);
    if (!match) {
      throw new Error(`Missing YAML frontmatter: ${filePath}`);
    }
    const frontmatterText = match[1];
    const bodyText = match[2];

    const metadata = parseYaml(frontmatterText) as Record<string, unknown>;
    const sections = parseSections(bodyText);
    const gradingCriteria = extractChecklist(sections.get("Grading Criteria") ?? "");
    const workspaceFiles = normalizeWorkspaceFiles(metadata.workspace_files);

    return {
      id: String(metadata.id ?? ""),
      name: String(metadata.name ?? ""),
      category: String(metadata.category ?? ""),
      gradingType: (metadata.grading_type as Task["gradingType"]) ?? "automated",
      timeoutSeconds: Number(metadata.timeout_seconds ?? 120),
      workspaceFiles,
      workspaceDir: typeof metadata.workspace_dir === "string" ? metadata.workspace_dir : undefined,
      automatedCheck: typeof metadata.automated_check === "string" ? metadata.automated_check : undefined,
      prompt: (sections.get("Prompt") ?? "").trim(),
      expectedBehavior: (sections.get("Expected Behavior") ?? "").trim(),
      gradingCriteria,
      taskDir: path.dirname(filePath),
      filePath,
    };
  }
}

function normalizeWorkspaceFiles(value: unknown): Task["workspaceFiles"] {
  if (!Array.isArray(value)) {
    return [];
  }
  const files: Task["workspaceFiles"] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const filePath = typeof record.path === "string" ? record.path : "";
    if (!filePath) {
      continue;
    }
    const content = typeof record.content === "string" ? record.content : undefined;
    files.push({ path: filePath, content });
  }
  return files;
}

function parseSections(body: string): Map<string, string> {
  const lines = body.split("\n");
  const sections = new Map<string, string>();
  let current: string | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const header = line.match(/^##\s+(.+)$/);
    if (header) {
      if (current) {
        sections.set(current, buffer.join("\n").trim());
      }
      current = header[1];
      buffer = [];
      continue;
    }
    if (current) {
      buffer.push(line);
    }
  }

  if (current) {
    sections.set(current, buffer.join("\n").trim());
  }

  return sections;
}

function extractChecklist(text: string): string[] {
  const lines = text.split("\n");
  const items: string[] = [];
  for (const line of lines) {
    const match = line.match(/^-+\s+\[[ xX]\]\s+(.+)$/);
    if (match) {
      items.push(match[1]);
    }
  }
  return items;
}
