import { hasAssistantResponse } from "../../messages";
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
  const scores = {
    agent_responded: hasAssistantResponse(ctx.messages) ? 1.0 : 0.0,
  };
  return { scores, total: averageScore(scores) };
}

