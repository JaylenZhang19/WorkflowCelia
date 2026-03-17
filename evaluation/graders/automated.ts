import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { GradeContext, GradeResult } from "../types";
import { extractToolCalls, hasAssistantResponse } from "../messages";

export async function gradeAutomated(ctx: GradeContext): Promise<GradeResult | null> {
  const external = await tryLoadExternalGrader(ctx);
  if (external) {
    return external;
  }

  switch (ctx.task.id) {
    case "task_00_sanity":
      return gradeSanity(ctx);
    case "task_01_calendar":
      return gradeCalendar(ctx);
    case "task_08_memory":
      return gradeMemory(ctx);
    case "task_09_files":
      return gradeFiles(ctx);
    case "task_12_skill_search":
      return gradeSkillSearch(ctx);
    case "task_16_email_triage":
      return gradeEmailTriage(ctx);
    case "task_17_email_search":
      return gradeEmailSearch(ctx);
    default:
      return null;
  }
}

async function tryLoadExternalGrader(ctx: GradeContext): Promise<GradeResult | null> {
  const rel = ctx.task.automatedCheck;
  if (!rel) {
    return null;
  }
  const checkPath = path.join(ctx.task.taskDir, rel);
  try {
    await fs.access(checkPath);
  } catch {
    return null;
  }

  const mod = await import(pathToFileURL(checkPath).href);
  const gradeFn: unknown = (mod as Record<string, unknown>).grade ?? (mod as Record<string, unknown>).default;
  if (typeof gradeFn !== "function") {
    throw new Error(`Invalid automated_check export for ${ctx.task.id}: expected 'export function grade(...)' in ${checkPath}`);
  }
  return (gradeFn as (ctx: GradeContext) => Promise<GradeResult>)(ctx);
}

function averageScore(scores: Record<string, number>): number {
  const values = Object.values(scores).filter((v) => Number.isFinite(v));
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

async function gradeSanity(ctx: GradeContext): Promise<GradeResult> {
  const scores = {
    agent_responded: hasAssistantResponse(ctx.messages) ? 1.0 : 0.0,
  };
  return { scores, total: averageScore(scores) };
}

async function gradeCalendar(ctx: GradeContext): Promise<GradeResult> {
  const scores: Record<string, number> = {
    file_created: 0.0,
    date_correct: 0.0,
    time_correct: 0.0,
    attendee_present: 0.0,
    title_correct: 0.0,
    description_present: 0.0,
  };

  const eventsPath = path.join(ctx.workspaceDir, "mockapps", "Calendar", "events.json");
  let eventsRaw: string;
  try {
    eventsRaw = await fs.readFile(eventsPath, "utf-8");
  } catch {
    return { scores, total: averageScore(scores) };
  }

  let events: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(eventsRaw);
    if (Array.isArray(parsed)) {
      events = parsed as Array<Record<string, unknown>>;
    }
  } catch {
    return { scores, total: averageScore(scores) };
  }

  if (events.length === 0) {
    return { scores, total: averageScore(scores) };
  }

  scores.file_created = 1.0;
  const event = events[0];

  const title = String(event.title ?? "");
  const notes = String(event.notes ?? "");
  const attendance = Array.isArray(event.attendance) ? event.attendance.map(String) : [];
  const startTime = Number(event.startTime ?? 0);

  if (attendance.some((email) => email.toLowerCase() === "john@example.com")) {
    scores.attendee_present = 1.0;
  }
  if (title.toLowerCase().includes("project sync")) {
    scores.title_correct = 1.0;
  }
  if (notes.toLowerCase().includes("roadmap")) {
    scores.description_present = 1.0;
  }

  if (Number.isFinite(startTime) && startTime > 0) {
    const startDate = new Date(startTime);
    scores.time_correct = startDate.getHours() === 15 && startDate.getMinutes() === 0 ? 1.0 : 0.0;

    const expectedDate = nextTuesdayDateString(new Date(ctx.baseTimeMs));
    const eventDate = formatDateYYYYMMDD(startDate);
    scores.date_correct = eventDate === expectedDate ? 1.0 : 0.0;
  }

  return { scores, total: averageScore(scores) };
}

async function gradeMemory(ctx: GradeContext): Promise<GradeResult> {
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
  } else if (/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(content) || /(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(content)) {
    scores.correct_date = 0.3;
  } else {
    scores.correct_date = 0.0;
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

async function gradeFiles(ctx: GradeContext): Promise<GradeResult> {
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

async function gradeSkillSearch(ctx: GradeContext): Promise<GradeResult> {
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
    scores.settings_host_updated = content.includes("prod-db.example.com") && !sanitized.includes("localhost") ? 1.0 : 0.0;
    scores.settings_db_updated = content.includes("myapp_prod") && !content.includes("myapp_dev") ? 1.0 : 0.0;
    scores.settings_loglevel_updated = content.toLowerCase().includes("\"warn\"") && !content.toLowerCase().includes("\"debug\"") ? 1.0 : 0.0;
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

async function gradeEmailTriage(ctx: GradeContext): Promise<GradeResult> {
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

async function gradeEmailSearch(ctx: GradeContext): Promise<GradeResult> {
  const scores: Record<string, number> = {
    file_created: 0.0,
    project_identified: 0.0,
    tech_stack: 0.0,
    budget_tracking: 0.0,
    timeline_tracking: 0.0,
    security_findings: 0.0,
    client_revenue: 0.0,
    noise_filtered: 0.0,
    has_required_sections: 0.0,
    cross_referencing: 0.0,
  };

  const summaryPath = path.join(ctx.workspaceDir, "alpha_summary.md");
  let content = "";
  try {
    content = await fs.readFile(summaryPath, "utf-8");
  } catch {
    return { scores, total: averageScore(scores) };
  }

  scores.file_created = 1.0;
  const contentLower = content.toLowerCase();

  if (/analytics\s+dashboard/i.test(contentLower)) {
    scores.project_identified = 1.0;
  } else if (/(analytics|dashboard|reporting)/i.test(contentLower)) {
    scores.project_identified = 0.5;
  }

  const techKeywords = [
    /postgresql|postgres|timescaledb/i,
    /fastapi/i,
    /react/i,
    /kafka/i,
    /flink/i,
    /redis/i,
    /recharts/i,
    /dbt/i,
  ];
  const techFound = techKeywords.filter((kw) => kw.test(contentLower)).length;
  if (techFound >= 6) {
    scores.tech_stack = 1.0;
  } else if (techFound >= 4) {
    scores.tech_stack = 0.75;
  } else if (techFound >= 2) {
    scores.tech_stack = 0.5;
  } else if (techFound >= 1) {
    scores.tech_stack = 0.25;
  }

  const hasOriginal = /\$?340\s*k|\$?340,?000/i.test(contentLower);
  const hasRevised = /\$?410\s*k|\$?410,?000|\$?432\s*k|\$?432,?000/i.test(contentLower);
  if (hasOriginal && hasRevised) {
    scores.budget_tracking = 1.0;
  } else if (hasOriginal || hasRevised) {
    scores.budget_tracking = 0.5;
  } else if (/(budget|cost|\$\d)/i.test(contentLower)) {
    scores.budget_tracking = 0.25;
  }

  const originalDates = [/apr(il)?\s*21/i, /may\s*12/i];
  const updatedDates = [/may\s*6/i, /may\s*27/i];
  const origFound = originalDates.filter((d) => d.test(contentLower)).length;
  const updatedFound = updatedDates.filter((d) => d.test(contentLower)).length;
  if (origFound >= 1 && updatedFound >= 1) {
    scores.timeline_tracking = 1.0;
  } else if (origFound >= 1 || updatedFound >= 1) {
    scores.timeline_tracking = 0.5;
  } else if (/(delay|slip|extend|push)/i.test(contentLower)) {
    scores.timeline_tracking = 0.25;
  }

  const securityKeywords = [
    /cross.?tenant/i,
    /websocket.*(auth|security)/i,
    /rate.?limit/i,
    /ssrf/i,
    /audit.?log/i,
  ];
  const secFound = securityKeywords.filter((kw) => kw.test(contentLower)).length;
  if (secFound >= 3) {
    scores.security_findings = 1.0;
  } else if (secFound >= 2) {
    scores.security_findings = 0.75;
  } else if (secFound >= 1) {
    scores.security_findings = 0.5;
  } else if (/security/i.test(contentLower)) {
    scores.security_findings = 0.25;
  }

  const clientNames = ["acme", "globaltech", "nexus", "summit", "dataflow"];
  const hasClientNames = clientNames.filter((name) => contentLower.includes(name)).length;
  const hasRevenue = /(\$?1\.85\s*m|\$?2\.8\s*m|\$?2\.1\s*m|arr|annual recurring)/i.test(contentLower);
  if (hasClientNames >= 3 && hasRevenue) {
    scores.client_revenue = 1.0;
  } else if (hasClientNames >= 2 || hasRevenue) {
    scores.client_revenue = 0.75;
  } else if (hasClientNames >= 1) {
    scores.client_revenue = 0.5;
  } else if (/(client|customer|sales|pipeline)/i.test(contentLower)) {
    scores.client_revenue = 0.25;
  }

  const noiseIndicators = [
    /team appreciation lunch/i,
    /techsummit 2026/i,
    /early bird pricing/i,
    /mediterranean.*asian.*bbq/i,
    /dietary preferences/i,
  ];
  const noiseFound = noiseIndicators.filter((n) => n.test(contentLower)).length;
  if (noiseFound === 0) {
    scores.noise_filtered = 1.0;
  } else if (noiseFound === 1) {
    scores.noise_filtered = 0.5;
  }

  const requiredSections = [
    /(project\s+)?overview/i,
    /timeline/i,
    /risk|issue/i,
    /client|business|revenue/i,
    /(current\s+)?status/i,
  ];
  const sectionsFound = requiredSections.filter((s) => s.test(contentLower)).length;
  scores.has_required_sections = sectionsFound / requiredSections.length;

  const crossRefIndicators = [
    /security.{0,100}(delay|slip|timeline|extend)/i,
    /(budget|cost).{0,100}(increas|overrun|expan|revis)/i,
    /(client|customer|feedback).{0,100}(priorit|feature|request)/i,
    /spot\s*instance.{0,100}(sav|reduc|cost)/i,
  ];
  const crossRefs = crossRefIndicators.filter((c) => c.test(contentLower)).length;
  if (crossRefs >= 3) {
    scores.cross_referencing = 1.0;
  } else if (crossRefs >= 2) {
    scores.cross_referencing = 0.75;
  } else if (crossRefs >= 1) {
    scores.cross_referencing = 0.5;
  }

  return { scores, total: averageScore(scores) };
}

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

function nextTuesdayDateString(baseDate: Date): string {
  const day = baseDate.getDay(); // 0=Sun..6=Sat
  const daysAhead = (2 - day + 7) % 7 || 7;
  const next = new Date(baseDate);
  next.setDate(baseDate.getDate() + daysAhead);
  return formatDateYYYYMMDD(next);
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

async function existsDir(target: string): Promise<boolean> {
  try {
    const stat = await fs.stat(target);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
