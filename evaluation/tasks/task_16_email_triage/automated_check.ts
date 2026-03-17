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
    file_created: 0.0,
    all_emails_covered: 0.0,
    priorities_assigned: 0.0,
    categories_assigned: 0.0,
    actions_assigned: 0.0,
    outage_is_p0: 0.0,
    alert_linked_to_outage: 0.0,
    client_is_high_priority: 0.0,
    spam_is_low_priority: 0.0,
    sorted_by_priority: 0.0,
    has_summary_section: 0.0,
  };

  const reportPath = path.join(ctx.workspaceDir, "triage_report.md");
  let content = "";
  try {
    content = await fs.readFile(reportPath, "utf-8");
  } catch {
    return { scores, total: averageScore(scores) };
  }

  scores.file_created = 1.0;
  const contentLower = content.toLowerCase();

  const emailIndicators = [
    /(production database outage|war room|p0 incident|david park)/,
    /(blog post review|sarah.?liu|marketing|q4 product)/,
    /(dependabot|pull request #?482|dependency update)/,
    /(benefits enrollment|jenna walsh|feb(ruary)?\s*28)/,
    /(bigclient|mike chen|\$2m|api integration timeline)/,
    /(linkedin|connection request)/,
    /(performance review|self.?assessment|rachel green)/,
    /(password rotation|ssh key|security compliance|feb(ruary)?\s*19)/,
    /(techdigest|newsletter|weekly.*ai agent)/,
    /(auth service refactor|alice wong|oauth2?\s*pkce|pr.*#?156)/,
    /(flash sale|saastools|60%\s*off|spam)/,
    /(budget reconciliation|linda zhao|cfo|q1 budget)/,
    /(api latency|monitoring alert|\[alert\]|p99.*2000)/,
  ];

  let foundEmails = 0;
  for (const pattern of emailIndicators) {
    if (pattern.test(contentLower)) {
      foundEmails += 1;
    }
  }
  scores.all_emails_covered = foundEmails / 13.0;

  const priorityMatches = content.match(/\bP[0-4]\b/gi) ?? [];
  if (priorityMatches.length >= 13) {
    scores.priorities_assigned = 1.0;
  } else if (priorityMatches.length >= 10) {
    scores.priorities_assigned = 0.75;
  } else if (priorityMatches.length >= 6) {
    scores.priorities_assigned = 0.5;
  } else if (priorityMatches.length >= 1) {
    scores.priorities_assigned = 0.25;
  }

  const categoryKeywords = [
    "incident",
    "client",
    "internal",
    "administrative",
    "admin",
    "code review",
    "code-review",
    "automated",
    "newsletter",
    "spam",
    "promotional",
  ];
  let categoriesFound = 0;
  for (const kw of categoryKeywords) {
    if (new RegExp(kw, "i").test(contentLower)) {
      categoriesFound += 1;
    }
  }
  if (categoriesFound >= 6) {
    scores.categories_assigned = 1.0;
  } else if (categoriesFound >= 4) {
    scores.categories_assigned = 0.75;
  } else if (categoriesFound >= 2) {
    scores.categories_assigned = 0.5;
  }

  const actionCount = (contentLower.match(/(action|respond|reply|review|schedule|join|ignore|archive|complete|submit|fill|approve|merge|delete|unsubscribe|forward|delegate|attend|read|dismiss)/g) ?? []).length;
  if (actionCount >= 13) {
    scores.actions_assigned = 1.0;
  } else if (actionCount >= 8) {
    scores.actions_assigned = 0.75;
  } else if (actionCount >= 4) {
    scores.actions_assigned = 0.5;
  } else if (actionCount >= 1) {
    scores.actions_assigned = 0.25;
  }

  scores.outage_is_p0 = scoreSection(contentLower, /(production database outage|david park|war room|cto)/, /\bp0\b/i, /\bp1\b/i);
  scores.alert_linked_to_outage = scoreAlertSection(contentLower);
  scores.client_is_high_priority = scoreSection(contentLower, /(bigclient|mike chen|\$2m|api integration)/, /\bp[01]\b/i, /\bp2\b/i);
  scores.spam_is_low_priority = scoreSection(contentLower, /(flash sale|saastools|60%.*off)/, /\bp4\b/i, /\bp3\b/i);

  const p0Positions = [...content.matchAll(/\bP0\b/gi)].map((m) => m.index ?? 0);
  const p4Positions = [...content.matchAll(/\bP4\b/gi)].map((m) => m.index ?? 0);
  if (p0Positions.length && p4Positions.length) {
    if (Math.max(...p0Positions) < Math.min(...p4Positions)) {
      scores.sorted_by_priority = 1.0;
    } else if (Math.min(...p0Positions) < Math.min(...p4Positions)) {
      scores.sorted_by_priority = 0.5;
    }
  } else if (p0Positions.length || p4Positions.length) {
    scores.sorted_by_priority = 0.25;
  }

  const firstChunk = contentLower.slice(0, Math.max(Math.floor(contentLower.length / 5), 200));
  if (/(summary|overview|highlights|critical items|day plan|top priorities)/i.test(firstChunk)) {
    scores.has_summary_section = 1.0;
  } else if (/(summary|overview|highlights)/i.test(contentLower)) {
    scores.has_summary_section = 0.5;
  }

  return { scores, total: averageScore(scores) };
}

function scoreSection(
  contentLower: string,
  sectionPattern: RegExp,
  primary: RegExp,
  secondary: RegExp,
): number {
  const match = contentLower.match(sectionPattern);
  if (!match || match.index === undefined) {
    return 0.0;
  }
  const start = Math.max(0, match.index - 200);
  const end = Math.min(contentLower.length, match.index + 500);
  const section = contentLower.slice(start, end);
  if (primary.test(section)) {
    return 1.0;
  }
  if (secondary.test(section)) {
    return 0.5;
  }
  return 0.0;
}

function scoreAlertSection(contentLower: string): number {
  const match = contentLower.match(/(api latency|monitoring alert|\balert\b.*threshold|p99)/);
  if (!match || match.index === undefined) {
    return 0.0;
  }
  const start = Math.max(0, match.index - 200);
  const end = Math.min(contentLower.length, match.index + 500);
  const section = contentLower.slice(start, end);
  if (/(relat|correlat|connect|linked|same.*incident|outage|database|incident)/.test(section)) {
    return 1.0;
  }
  if (/\bp0\b/i.test(section)) {
    return 0.75;
  }
  return 0.0;
}

