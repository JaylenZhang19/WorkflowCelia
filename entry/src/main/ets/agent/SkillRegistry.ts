import { ParsedSkillDocument, SkillSpec } from './SkillSpec';
import { SkillDefinition } from './types';

const DEFAULT_SKILL_MARKDOWNS: Array<{ directoryName: string; markdown: string }> = [
  {
    directoryName: 'file-ops',
    markdown: `---
name: file-ops
description: Inspect and manage sandbox files. Use when user asks to list directories or inspect file entries.
allowed-tools: Tool(File:listFile)
---

# File Ops

## When to use this skill
Use this skill when users ask to check files, list directories, or inspect file structures.

## Workflow
1. Parse path from user input if provided.
2. If path is missing, use app sandbox default path.
3. Call File.listFile and summarize results.
`
  },
  {
    directoryName: 'calendar-ops',
    markdown: `---
name: calendar-ops
description: Query calendar events in a time range. Use when user asks about schedules, events, or meetings.
allowed-tools: Tool(Calendar:getEvents)
---

# Calendar Ops

## When to use this skill
Use this skill when users ask for events, schedule checks, or upcoming meetings.

## Workflow
1. Build a reasonable time window around now.
2. Call Calendar.getEvents.
3. Return a concise summary.
`
  },
  {
    directoryName: 'contact-ops',
    markdown: `---
name: contact-ops
description: Query contacts by key. Use when user asks to find contact details.
allowed-tools: Tool(Contact:queryContact)
---

# Contact Ops

## When to use this skill
Use this skill when users ask to search or find contacts.

## Workflow
1. Extract contact key from user input.
2. Call Contact.queryContact.
3. Return found contact information or not-found status.
`
  },
  {
    directoryName: 'general-chat',
    markdown: `---
name: general-chat
description: Handle general requests when no specialized tool skill applies.
---

# General Chat

## When to use this skill
Use this skill for greeting, clarification, and requests that do not require a tool.
`
  }
];

export class SkillRegistry {
  private readonly skills: ParsedSkillDocument[];

  constructor(customSkills?: ParsedSkillDocument[]) {
    if (customSkills && customSkills.length > 0) {
      this.skills = customSkills;
      return;
    }
    this.skills = DEFAULT_SKILL_MARKDOWNS.map((item) =>
      SkillSpec.parseSkillMarkdown(item.directoryName, item.markdown)
    );
  }

  listSkillMetadata(): SkillDefinition[] {
    return this.skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      keywords: [...s.keywords],
      allowedTools: [...s.allowedTools]
    }));
  }

  activateSkillByName(name: string): ParsedSkillDocument | null {
    const matched = this.skills.find((s) => s.name === name.trim());
    return matched ?? null;
  }

  fallbackResolveSkill(input: string): ParsedSkillDocument {
    const lowerInput = input.toLowerCase();
    for (const skill of this.skills) {
      if (skill.name === 'general-chat') {
        continue;
      }
      for (const keyword of skill.keywords) {
        if (lowerInput.includes(keyword)) {
          return skill;
        }
      }
    }
    return this.skills[this.skills.length - 1];
  }
}
