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

