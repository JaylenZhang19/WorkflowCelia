import fs from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { Task } from "./types";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

export class TaskLoader {
  constructor(private tasksDir: string) {}

  async loadAll(): Promise<Task[]> {
    const entries = await fs.readdir(this.tasksDir);
    const taskFiles = entries
      .filter((name) => name.startsWith("task_") && name.endsWith(".md"))
      .map((name) => path.join(this.tasksDir, name))
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

    return {
      id: String(metadata.id ?? ""),
      name: String(metadata.name ?? ""),
      category: String(metadata.category ?? ""),
      gradingType: (metadata.grading_type as Task["gradingType"]) ?? "automated",
      timeoutSeconds: Number(metadata.timeout_seconds ?? 120),
      workspaceFiles: (metadata.workspace_files as Task["workspaceFiles"]) ?? [],
      prompt: (sections.get("Prompt") ?? "").trim(),
      expectedBehavior: (sections.get("Expected Behavior") ?? "").trim(),
      gradingCriteria,
      filePath,
    };
  }
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
