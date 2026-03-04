import { logger } from '../utils/Logger';
import { SessionStore } from './SessionStore';
import { SkillRegistry } from './SkillRegistry';
import { ToolRegistry } from './ToolRegistry';
import { LlmPlanner } from './LlmPlanner';
import { OpenAICompatibleClient, OpenAICompatibleConfig } from './LlmClient';
import { ParsedSkillDocument } from './SkillSpec';
import { AgentStepEvent, AgentTurnInput, AgentTurnResult, SkillDefinition, ToolPlan } from './types';

const TAG = 'AgentRuntime';

interface RunTurnOptions {
  onStep?: (step: AgentStepEvent) => void;
}

interface AgentRuntimeConfig {
  llm?: OpenAICompatibleConfig;
}

export class AgentRuntime {
  private readonly skillRegistry: SkillRegistry;
  private readonly toolRegistry: ToolRegistry;
  private readonly sessionStore: SessionStore;
  private readonly llmPlanner?: LlmPlanner;
  private readonly defaultFilePath: string = '/data/storage/el2/base/files';

  constructor(params?: {
    skillRegistry?: SkillRegistry;
    toolRegistry?: ToolRegistry;
    sessionStore?: SessionStore;
    config?: AgentRuntimeConfig;
  }) {
    this.skillRegistry = params?.skillRegistry ?? new SkillRegistry();
    this.toolRegistry = params?.toolRegistry ?? new ToolRegistry();
    this.sessionStore = params?.sessionStore ?? new SessionStore();

    const llmConfig = params?.config?.llm;
    if (llmConfig) {
      const client = new OpenAICompatibleClient(llmConfig);
      if (client.isEnabled()) {
        const docs = this.skillRegistry
          .listSkillMetadata()
          .map((meta) => this.skillRegistry.activateSkillByName(meta.name))
          .filter((skill): skill is ParsedSkillDocument => Boolean(skill));
        this.llmPlanner = new LlmPlanner(client, docs);
      }
    }
  }

  async runTurn(input: AgentTurnInput, options?: RunTurnOptions): Promise<AgentTurnResult> {
    const steps: AgentStepEvent[] = [];
    const emit = (type: AgentStepEvent['type'], title: string, content: string) => {
      const step: AgentStepEvent = { type, title, content, timestamp: Date.now() };
      steps.push(step);
      options?.onStep?.(step);
    };

    this.sessionStore.appendTurn(input.sessionId, {
      role: 'user',
      content: input.input,
      timestamp: Date.now()
    });

    const planning = await this.plan(input.input);
    emit('thought', 'Understand Intent', planning.thought);
    emit(
      'skill',
      `Select Skill (${planning.source})`,
      `Skill: ${planning.selectedSkill.name}\nDescription: ${planning.selectedSkill.description}\nAllowed tools: ${this.formatAllowedTools(planning.selectedSkill)}`
    );

    if (!planning.plan) {
      emit('action', 'Plan Action', 'No tool call required for this turn.');
      emit('observation', 'Observe', 'No external tool observation.');
      const finalNoTool =
        planning.finalDraft ||
        `Skill "${planning.selectedSkill.name}" selected. No tool invoked for this input.`;
      emit('final', 'Final Answer', finalNoTool);
      this.sessionStore.appendTurn(input.sessionId, {
        role: 'agent',
        content: finalNoTool,
        timestamp: Date.now()
      });
      return { finalText: finalNoTool, steps };
    }

    const toolAllowed = planning.selectedSkill.allowedTools.some(
      (tool) =>
        tool.namespace === planning.plan?.query.header.namespace &&
        tool.name === planning.plan?.query.header.name
    );

    if (!toolAllowed) {
      const finalDenied =
        `Tool denied by skill policy: ${planning.plan.query.header.namespace}.${planning.plan.query.header.name}.`;
      emit('action', 'Invoke Tool', `Blocked by allowed-tools policy.\n${this.toJson(planning.plan.query)}`);
      emit('observation', 'Tool Observation', 'No call executed due to policy guard.');
      emit('final', 'Final Answer', finalDenied);
      this.sessionStore.appendTurn(input.sessionId, {
        role: 'agent',
        content: finalDenied,
        timestamp: Date.now()
      });
      return { finalText: finalDenied, steps };
    }

    emit('action', 'Invoke Tool', `Reason: ${planning.plan.reason}\nQuery:\n${this.toJson(planning.plan.query)}`);
    const toolExecution = await this.toolRegistry.invoke(planning.plan.query);
    logger.info(
      TAG,
      `Tool invocation: ${planning.plan.query.header.namespace}.${planning.plan.query.header.name}, success=${toolExecution.result.success}`
    );
    emit('observation', 'Tool Observation', this.toJson(toolExecution.result));

    const finalText =
      toolExecution.result.success
        ? planning.finalDraft ||
          `Tool executed successfully: ${planning.plan.query.header.namespace}.${planning.plan.query.header.name}\nSummary: ${this.summarizeOutputs(toolExecution.result.outputs)}`
        : `Tool failed: ${planning.plan.query.header.namespace}.${planning.plan.query.header.name}\nErrorCode: ${toolExecution.result.errorCode ?? 'UNKNOWN'}\nError: ${toolExecution.result.error ?? 'Unknown error'}`;

    emit('final', 'Final Answer', finalText);
    this.sessionStore.appendTurn(input.sessionId, {
      role: 'agent',
      content: finalText,
      timestamp: Date.now()
    });
    return { finalText, steps };
  }

  private async plan(input: string): Promise<{
    source: 'llm' | 'rule';
    thought: string;
    selectedSkill: SkillDefinition;
    plan: ToolPlan | null;
    finalDraft: string;
  }> {
    if (this.llmPlanner) {
      try {
        const result = await this.llmPlanner.plan(input);
        return {
          source: 'llm',
          thought: result.thought,
          selectedSkill: result.selectedSkill,
          plan: result.plan,
          finalDraft: result.finalDraft
        };
      } catch (error) {
        logger.warn(TAG, `LLM planning failed, fallback to rule planner: ${JSON.stringify(error)}`);
      }
    }

    const skill = this.skillRegistry.fallbackResolveSkill(input);
    return {
      source: 'rule',
      thought: `Fallback rule planner selected. Analyze input and pick a safe tool plan.\nInput: ${input}`,
      selectedSkill: skill,
      plan: this.fallbackPlanToolCall(input, skill),
      finalDraft: ''
    };
  }

  private fallbackPlanToolCall(input: string, skill: ParsedSkillDocument): ToolPlan | null {
    if (skill.name === 'file-ops') {
      const pathMatch = input.match(/(?:path|路径)\s*[:=]\s*([^\s,]+)/i);
      const path = pathMatch && pathMatch[1] ? pathMatch[1] : this.defaultFilePath;
      return {
        reason: 'Rule planner selected File.listFile.',
        query: {
          header: { namespace: 'File', name: 'listFile' },
          payload: { args: { path } }
        }
      };
    }

    if (skill.name === 'calendar-ops') {
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      return {
        reason: 'Rule planner selected Calendar.getEvents.',
        query: {
          header: { namespace: 'Calendar', name: 'getEvents' },
          payload: { args: { start: now - sevenDaysMs, end: now + sevenDaysMs } }
        }
      };
    }

    if (skill.name === 'contact-ops') {
      const keyMatch = input.match(/(?:contact|联系人)\s+([^\s,]+)/i);
      const key = keyMatch && keyMatch[1] ? keyMatch[1] : 'default';
      return {
        reason: 'Rule planner selected Contact.queryContact.',
        query: {
          header: { namespace: 'Contact', name: 'queryContact' },
          payload: { args: { key } }
        }
      };
    }

    return null;
  }

  private formatAllowedTools(skill: SkillDefinition): string {
    if (skill.allowedTools.length === 0) {
      return '(none)';
    }
    return skill.allowedTools.map((tool) => `${tool.namespace}.${tool.name}`).join(', ');
  }

  private summarizeOutputs(outputs?: Record<string, any>): string {
    if (!outputs) {
      return 'No outputs returned.';
    }
    return this.toJson(outputs);
  }

  private toJson(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_) {
      return String(value);
    }
  }
}
