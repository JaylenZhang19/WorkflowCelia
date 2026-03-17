import fs from "node:fs/promises";
import path from "node:path";
import { extractToolCalls } from "../../messages";
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
    file_created: 0.0,
    correct_date: 0.0,
    clear_answer: 0.0,
    read_notes: 0.0,
    no_hallucination: 0.0,
  };

  const answerPath = path.join(ctx.workspaceDir, "answer.txt");
  let content = "";
  try {
    content = (await fs.readFile(answerPath, "utf-8")).toLowerCase();
  } catch {
    return { scores, total: averageScore(scores) };
  }

  scores.file_created = 1.0;

  const datePatterns = [
    /june\s+1,?\s+2024/i,
    /june\s+1st,?\s+2024/i,
    /6\/1\/2024/i,
    /6-1-2024/i,
    /2024-06-01/i,
    /01\s+june\s+2024/i,
    /1\s+june\s+2024/i,
  ];

  if (datePatterns.some((p) => p.test(content))) {
    scores.correct_date = 1.0;
  } else if (
    /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(content) ||
    /(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(content)
  ) {
    scores.correct_date = 0.3;
  }

  const trimmed = content.trim();
  if (trimmed.length > 10 && (trimmed.includes("beta") || trimmed.includes("release") || trimmed.includes("deadline"))) {
    scores.clear_answer = 1.0;
  } else if (trimmed.length > 5) {
    scores.clear_answer = 0.5;
  }

  const toolCalls = extractToolCalls(ctx.messages);
  const readNotes = toolCalls.some((call) => {
    if (call.name !== "read_file" && call.name !== "readFile") {
      return false;
    }
    const pathValue = call.args.path;
    return typeof pathValue === "string" && pathValue.includes("notes.md");
  });
  scores.read_notes = readNotes ? 1.0 : 0.0;

  const wrongDates = [/march\s+15/i, /september\s+30/i, /3\/15/i, /9\/30/i];
  scores.no_hallucination = wrongDates.some((p) => p.test(content)) ? 0.0 : 1.0;

  return { scores, total: averageScore(scores) };
}
