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

