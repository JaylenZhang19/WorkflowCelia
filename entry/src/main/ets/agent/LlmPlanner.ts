import { logger } from '../utils/Logger';
import { LlmClient } from './LlmClient';
import { ParsedSkillDocument } from './SkillSpec';
import { SkillDefinition, ToolPlan } from './types';

const TAG = 'LlmPlanner';

export interface LlmPlanningResult {
  plannerSource: 'llm';
  thought: string;
  selectedSkill: SkillDefinition;
  plan: ToolPlan | null;
  finalDraft: string;
}

export class LlmPlanner {
  private readonly llmClient: LlmClient;
  private readonly skills: ParsedSkillDocument[];

  constructor(llmClient: LlmClient, skills: ParsedSkillDocument[]) {
    this.llmClient = llmClient;
    this.skills = skills;
  }

  async plan(input: string): Promise<LlmPlanningResult> {
    const selectedSkill = await this.selectSkillByMetadata(input);
    const activatedSkill = this.skills.find((s) => s.name === selectedSkill.name) ?? this.skills[0];
    const actionResult = await this.planAction(input, activatedSkill);
    return {
      plannerSource: 'llm',
      thought: actionResult.thought,
      selectedSkill,
      plan: actionResult.plan,
      finalDraft: actionResult.finalDraft
    };
  }

  private async selectSkillByMetadata(input: string): Promise<SkillDefinition> {
    const skillMetaText = this.skills
      .map((s) => `- name: ${s.name}\n  description: ${s.description}`)
      .join('\n');

    const system = [
      'You are a strict planner for skill selection.',
      'Choose exactly one skill based on user input.',
      'Output JSON only: {"skill":"<skill-name>","reason":"..."}',
      'skill must be one of the provided names.'
    ].join('\n');

    const user = [
      `User Input:\n${input}`,
      '',
      'Available Skills (metadata only):',
      skillMetaText
    ].join('\n');

    const text = await this.llmClient.chat([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]);
    const parsed = this.parseJson(text) as { skill?: string; reason?: string };
    const chosen = (parsed.skill ?? '').trim();
    const matched = this.skills.find((s) => s.name === chosen);
    if (matched) {
      logger.info(TAG, `Skill selected by LLM: ${matched.name}`);
      return matched;
    }
    logger.warn(TAG, `LLM returned unknown skill "${chosen}", fallback to first skill`);
    return this.skills[0];
  }

  private async planAction(
    input: string,
    skill: ParsedSkillDocument
  ): Promise<{ thought: string; plan: ToolPlan | null; finalDraft: string }> {
    const allowedTools =
      skill.allowedTools.length > 0
        ? skill.allowedTools.map((t) => `${t.namespace}.${t.name}`).join(', ')
        : '(none)';
    const system = [
      'You are a tool planner.',
      'Given one activated skill and user input, decide whether to call one tool.',
      'Output JSON only with this schema:',
      '{',
      '  "thought": "short reasoning",',
      '  "call_tool": true|false,',
      '  "tool": {"namespace":"...","name":"...","args":{...},"reason":"..."},',
      '  "final_draft": "draft answer text"',
      '}',
      'Rules:',
      '1) If call_tool=false, set tool to null.',
      '2) If call_tool=true, tool must be from allowed tools.',
      '3) Keep args JSON-safe.'
    ].join('\n');

    const user = [
      `User Input:\n${input}`,
      '',
      `Activated Skill: ${skill.name}`,
      `Skill Description: ${skill.description}`,
      `Allowed Tools: ${allowedTools}`,
      '',
      'Skill Instructions (from SKILL.md body):',
      skill.instructions
    ].join('\n');

    const text = await this.llmClient.chat([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]);
    const parsed = this.parseJson(text) as {
      thought?: string;
      call_tool?: boolean;
      tool?: { namespace?: string; name?: string; args?: Record<string, any>; reason?: string } | null;
      final_draft?: string;
    };

    const thought = (parsed.thought ?? 'Plan created by LLM planner.').trim();
    const finalDraft = (parsed.final_draft ?? '').trim();
    if (!parsed.call_tool || !parsed.tool) {
      return { thought, plan: null, finalDraft };
    }

    const namespace = (parsed.tool.namespace ?? '').trim();
    const name = (parsed.tool.name ?? '').trim();
    const isAllowed = skill.allowedTools.some((t) => t.namespace === namespace && t.name === name);
    if (!isAllowed) {
      logger.warn(TAG, `LLM planned non-allowed tool ${namespace}.${name}, dropped`);
      return { thought, plan: null, finalDraft };
    }

    return {
      thought,
      finalDraft,
      plan: {
        reason: parsed.tool.reason ?? 'LLM selected tool call.',
        query: {
          header: { namespace, name },
          payload: { args: parsed.tool.args ?? {} }
        }
      }
    };
  }

  private parseJson(raw: string): unknown {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() ?? raw.trim();
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error(`LLM output is not valid JSON: ${raw}`);
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

