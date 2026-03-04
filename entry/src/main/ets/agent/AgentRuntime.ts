import { logger } from '../utils/Logger';
import { QueryMessage } from '../abilityprovider/AbilityTypes';
import { SessionStore } from './SessionStore';
import { SkillRegistry } from './SkillRegistry';
import { ToolRegistry } from './ToolRegistry';
import { AgentStepEvent, AgentTurnInput, AgentTurnResult, SkillDefinition, ToolPlan } from './types';

const TAG = 'AgentRuntime';

interface RunTurnOptions {
  onStep?: (step: AgentStepEvent) => void;
}

export class AgentRuntime {
  private readonly skillRegistry: SkillRegistry;
  private readonly toolRegistry: ToolRegistry;
  private readonly sessionStore: SessionStore;
  private readonly defaultFilePath: string = '/data/storage/el2/base/files';

  constructor(params?: { skillRegistry?: SkillRegistry; toolRegistry?: ToolRegistry; sessionStore?: SessionStore }) {
    this.skillRegistry = params?.skillRegistry ?? new SkillRegistry();
    this.toolRegistry = params?.toolRegistry ?? new ToolRegistry();
    this.sessionStore = params?.sessionStore ?? new SessionStore();
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

    emit(
      'thought',
      'Understand Intent',
      `Analyze user input and decide whether a tool call is needed.\nInput: ${input.input}`
    );

    const skill = this.skillRegistry.resolveSkill(input.input);
    emit(
      'skill',
      'Select Skill',
      `Skill: ${skill.name}\nDescription: ${skill.description}\nAllowed tools: ${this.formatAllowedTools(skill)}`
    );

    const plan = this.planToolCall(input.input, skill);
    if (!plan) {
      emit('action', 'Plan Action', 'No tool call required for this turn.');
      emit('observation', 'Observe', 'No external observation. Answer from current intent only.');
      const finalText =
        `Skill "${skill.name}" selected. No tool invoked.\n` +
        'Try: "list files", "show calendar events", or "query contact Alice".';
      emit('final', 'Final Answer', finalText);
      this.sessionStore.appendTurn(input.sessionId, {
        role: 'agent',
        content: finalText,
        timestamp: Date.now()
      });
      return { finalText, steps };
    }

    emit('action', 'Invoke Tool', `Reason: ${plan.reason}\nQuery:\n${this.toJson(plan.query)}`);

    const toolExecution = await this.toolRegistry.invoke(plan.query);
    logger.info(
      TAG,
      `Tool invocation: ${plan.query.header.namespace}.${plan.query.header.name}, success=${toolExecution.result.success}`
    );
    emit('observation', 'Tool Observation', this.toJson(toolExecution.result));

    let finalText: string;
    if (toolExecution.result.success) {
      finalText =
        `Tool executed successfully: ${plan.query.header.namespace}.${plan.query.header.name}\n` +
        `Summary: ${this.summarizeOutputs(toolExecution.result.outputs)}`;
    } else {
      finalText =
        `Tool failed: ${plan.query.header.namespace}.${plan.query.header.name}\n` +
        `ErrorCode: ${toolExecution.result.errorCode ?? 'UNKNOWN'}\n` +
        `Error: ${toolExecution.result.error ?? 'Unknown error'}`;
    }
    emit('final', 'Final Answer', finalText);

    this.sessionStore.appendTurn(input.sessionId, {
      role: 'agent',
      content: finalText,
      timestamp: Date.now()
    });

    return { finalText, steps };
  }

  private formatAllowedTools(skill: SkillDefinition): string {
    if (skill.allowedTools.length === 0) {
      return '(none)';
    }
    return skill.allowedTools.map((tool) => `${tool.namespace}.${tool.name}`).join(', ');
  }

  private planToolCall(input: string, skill: SkillDefinition): ToolPlan | null {
    if (skill.id === 'file_ops') {
      const pathMatch = input.match(/(?:path|路径)\s*[:=]\s*([^\s,]+)/i);
      const path = pathMatch && pathMatch[1] ? pathMatch[1] : this.defaultFilePath;
      return {
        reason: 'File skill matched. Inspect directory entries with File.listFile.',
        query: {
          header: { namespace: 'File', name: 'listFile' },
          payload: { args: { path } }
        }
      };
    }

    if (skill.id === 'calendar_ops') {
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      return {
        reason: 'Calendar skill matched. Query nearby events in a 14-day window.',
        query: {
          header: { namespace: 'Calendar', name: 'getEvents' },
          payload: { args: { start: now - sevenDaysMs, end: now + sevenDaysMs } }
        }
      };
    }

    if (skill.id === 'contact_ops') {
      const keyMatch = input.match(/(?:contact|联系人)\s+([^\s,]+)/i);
      const key = keyMatch && keyMatch[1] ? keyMatch[1] : 'default';
      return {
        reason: 'Contact skill matched. Query contact by extracted key.',
        query: {
          header: { namespace: 'Contact', name: 'queryContact' },
          payload: { args: { key } }
        }
      };
    }

    return null;
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

