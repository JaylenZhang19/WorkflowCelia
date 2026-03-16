import fs from "node:fs/promises";
import path from "node:path";
import { TaskLoader } from "./taskLoader";
import { TaskReport, Task } from "./types";
import { extractTimestamp, findMessagesFile, loadMessages } from "./messages";
import { gradeAutomated } from "./graders/automated";

type Args = {
  resultsDir: string;
  tasks?: string[];
  output?: string;
  tasksDir: string;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.resultsDir) {
    printUsage();
    process.exit(1);
  }

  const loader = new TaskLoader(args.tasksDir);
  const allTasks = await loader.loadAll();
  const selected = filterTasks(allTasks, args.tasks);

  const reports: TaskReport[] = [];
  for (const task of selected) {
    const report = await evaluateTask(task, args.resultsDir);
    reports.push(report);
  }

  printSummary(reports);

  if (args.output) {
    await fs.writeFile(args.output, JSON.stringify({ results: reports }, null, 2), "utf-8");
  }
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    resultsDir: "",
    tasksDir: path.resolve(process.cwd(), "evaluation", "tasks"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];
    if (current === "--results" && next) {
      args.resultsDir = path.resolve(process.cwd(), next);
      i += 1;
    } else if (current === "--tasks" && next) {
      args.tasks = next.split(",").map((t) => t.trim()).filter(Boolean);
      i += 1;
    } else if (current === "--output" && next) {
      args.output = path.resolve(process.cwd(), next);
      i += 1;
    } else if (current === "--tasks-dir" && next) {
      args.tasksDir = path.resolve(process.cwd(), next);
      i += 1;
    }
  }
  return args;
}

function printUsage() {
  console.log("Usage: npm run evaluate -- --results <dir> [--tasks task_01,task_02] [--output report.json]");
}

function filterTasks(tasks: Task[], taskIds?: string[]): Task[] {
  if (!taskIds || taskIds.length === 0) {
    return tasks;
  }
  const allowed = new Set(taskIds);
  return tasks.filter((task) => allowed.has(task.id));
}

async function evaluateTask(task: Task, resultsDir: string): Promise<TaskReport> {
  const taskDir = path.join(resultsDir, task.id);
  try {
    await fs.access(taskDir);
  } catch {
    return {
      taskId: task.id,
      gradingType: task.gradingType,
      status: "missing_workspace",
      automatedScores: {},
      automatedTotal: null,
      notes: "Task workspace not found",
    };
  }

  const messagesFile = await findMessagesFile(taskDir);
  if (!messagesFile) {
    return {
      taskId: task.id,
      gradingType: task.gradingType,
      status: "missing_messages",
      automatedScores: {},
      automatedTotal: null,
      notes: "messages.json not found in task workspace",
    };
  }

  const messages = await loadMessages(messagesFile);
  const baseTimeMs = extractTimestamp(messages) ?? Date.now();

  if (task.gradingType === "llm_judge") {
    return {
      taskId: task.id,
      gradingType: task.gradingType,
      status: "llm_judge_not_supported",
      automatedScores: {},
      automatedTotal: null,
      notes: "LLM judge is not implemented in evaluation tooling",
    };
  }

  const automated = await gradeAutomated({
    task,
    messages,
    workspaceDir: taskDir,
    baseTimeMs,
  });

  if (!automated) {
    return {
      taskId: task.id,
      gradingType: task.gradingType,
      status: "llm_judge_not_supported",
      automatedScores: {},
      automatedTotal: null,
      notes: "Automated grader not implemented for this task",
    };
  }

  const note =
    task.gradingType === "hybrid"
      ? "Hybrid task: only automated score computed; LLM judge missing"
      : undefined;

  return {
    taskId: task.id,
    gradingType: task.gradingType,
    status: "ok",
    automatedScores: automated.scores,
    automatedTotal: automated.total,
    notes: note,
  };
}

function printSummary(reports: TaskReport[]) {
  console.log("\nEvaluation Summary");
  for (const report of reports) {
    const scoreText =
      report.automatedTotal === null ? "n/a" : report.automatedTotal.toFixed(3);
    console.log(
      `- ${report.taskId}: ${report.status} | automated=${scoreText}`
    );
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
