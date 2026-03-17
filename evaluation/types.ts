export type GradingType = "automated" | "llm_judge" | "hybrid";

export interface Task {
  id: string;
  name: string;
  category: string;
  gradingType: GradingType;
  timeoutSeconds: number;
  /**
   * Legacy inline workspace file definitions embedded in task frontmatter.
   * New-style tasks should prefer putting real files under `workspaceDir`.
   */
  workspaceFiles: Array<{ path: string; content?: string }>;
  /**
   * New-style tasks: relative folder (from `taskDir`) containing resources.
   * Example: "workspace" => `${taskDir}/workspace/*`.
   */
  workspaceDir?: string;
  /**
   * New-style tasks: relative path (from `taskDir`) to an automated grader entry.
   * Example: "automated_check.ts".
   */
  automatedCheck?: string;
  prompt: string;
  expectedBehavior: string;
  gradingCriteria: string[];
  /**
   * Directory containing this task's markdown definition.
   * For legacy tasks, this will be the shared tasks directory.
   */
  taskDir: string;
  filePath: string;
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  name?: string;
  tool_call_id?: string;
}

export interface ToolCall {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
  name?: string;
  arguments?: string;
}

export interface GradeContext {
  task: Task;
  messages: Message[];
  workspaceDir: string;
  baseTimeMs: number;
}

export interface GradeResult {
  scores: Record<string, number>;
  total: number;
  notes?: string;
}

export interface TaskReport {
  taskId: string;
  gradingType: GradingType;
  status: "ok" | "missing_messages" | "missing_workspace" | "llm_judge_not_supported";
  automatedScores: Record<string, number>;
  automatedTotal: number | null;
  notes?: string;
}
