import fs from "node:fs/promises";
import path from "node:path";
import { Message, ToolCall } from "./types";

export async function loadMessages(messagesPath: string): Promise<Message[]> {
  const raw = await fs.readFile(messagesPath, "utf-8");
  const parsed = JSON.parse(raw) as Message[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function findMessagesFile(taskDir: string): Promise<string | null> {
  const entries = await fs.readdir(taskDir);
  const candidates = entries
    .filter((name) => /messages.*\.json$/i.test(name))
    .sort();
  if (candidates.length === 0) {
    return null;
  }
  return path.join(taskDir, candidates[candidates.length - 1]);
}

export function extractToolCalls(messages: Message[]): Array<{
  name: string;
  args: Record<string, unknown>;
}> {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  for (const message of messages) {
    if (message.role !== "assistant" || !message.tool_calls) {
      continue;
    }
    for (const raw of message.tool_calls) {
      const name = raw.function?.name ?? raw.name;
      if (!name) {
        continue;
      }
      const argText = raw.function?.arguments ?? raw.arguments ?? "";
      let args: Record<string, unknown> = {};
      if (typeof argText === "string" && argText.trim().length > 0) {
        try {
          const parsed = JSON.parse(argText) as Record<string, unknown>;
          if (parsed && typeof parsed === "object") {
            args = parsed;
          }
        } catch {
          args = {};
        }
      }
      calls.push({ name, args });
    }
  }
  return calls;
}

export function extractTimestamp(messages: Message[]): number | null {
  for (const message of messages) {
    if (message.role !== "system" || typeof message.content !== "string") {
      continue;
    }
    const match = message.content.match(/timestamp:\s*(\d+)/i);
    if (match) {
      const value = Number(match[1]);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }
  return null;
}

export function hasAssistantResponse(messages: Message[]): boolean {
  return messages.some((message) => {
    if (message.role !== "assistant") {
      return false;
    }
    const hasContent = typeof message.content === "string" && message.content.trim().length > 0;
    const hasTools = Array.isArray(message.tool_calls) && message.tool_calls.length > 0;
    return hasContent || hasTools;
  });
}
