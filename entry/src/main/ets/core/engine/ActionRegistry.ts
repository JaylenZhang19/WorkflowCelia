/**
 * Action Registry
 * Central registry for all available actions in the workflow system
 */
import { ActionDefinition, ActionExecutor, ActionCategory, BUILTIN_CATEGORIES } from '../models/Action';

interface RegisteredAction {
  definition: ActionDefinition;
  executor: ActionExecutor;
  enabled: boolean;
  registeredAt: number;
}

/**
 * Action Registry singleton
 */
export class ActionRegistry {
  private static instance: ActionRegistry;
  private actions: Map<string, RegisteredAction> = new Map();
  private categories: Map<string, ActionCategory> = new Map();

  private constructor() {
    BUILTIN_CATEGORIES.forEach(cat => {
      this.categories.set(cat.id, cat);
    });
  }

  static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  register(definition: ActionDefinition, executor: ActionExecutor): void {
    if (this.actions.has(definition.id)) {
      console.warn(`Action '${definition.id}' is already registered. Overwriting.`);
    }

    this.actions.set(definition.id, {
      definition,
      executor,
      enabled: true,
      registeredAt: Date.now()
    });

    console.info(`Action '${definition.id}' registered successfully`);
  }

  unregister(actionId: string): boolean {
    const existed = this.actions.delete(actionId);
    if (existed) {
      console.info(`Action '${actionId}' unregistered`);
    }
    return existed;
  }

  getDefinition(actionId: string): ActionDefinition | undefined {
    const registered = this.actions.get(actionId);
    return registered ? registered.definition : undefined;
  }

  getExecutor(actionId: string): ActionExecutor | undefined {
    const registered = this.actions.get(actionId);
    return registered ? registered.executor : undefined;
  }

  isRegistered(actionId: string): boolean {
    return this.actions.has(actionId);
  }

  getAllActions(): ActionDefinition[] {
    const definitions: ActionDefinition[] = [];
    this.actions.forEach((registered) => {
      if (registered.enabled) {
        definitions.push(registered.definition);
      }
    });
    return definitions;
  }

  getActionsByCategory(categoryId: string): ActionDefinition[] {
    const definitions: ActionDefinition[] = [];
    this.actions.forEach((registered) => {
      if (registered.enabled && registered.definition.category === categoryId) {
        definitions.push(registered.definition);
      }
    });
    return definitions;
  }

  searchActions(keyword: string): ActionDefinition[] {
    const lowerKeyword = keyword.toLowerCase();
    const results: ActionDefinition[] = [];
    
    this.actions.forEach((registered) => {
      if (!registered.enabled) return;
      
      const { definition } = registered;
      const nameMatch = definition.name.toLowerCase().includes(lowerKeyword);
      const descMatch = definition.description.toLowerCase().includes(lowerKeyword);
      const categoryMatch = definition.category.toLowerCase().includes(lowerKeyword);
      
      if (nameMatch || descMatch || categoryMatch) {
        results.push(definition);
      }
    });
    
    return results;
  }

  getCategoriesWithCounts(): Array<ActionCategory & { actionCount: number }> {
    const categories: Array<ActionCategory & { actionCount: number }> = [];
    
    this.categories.forEach((category) => {
      const count = this.getActionsByCategory(category.id).length;
      categories.push({ ...category, actionCount: count });
    });
    
    return categories;
  }

  registerCategory(category: ActionCategory): void {
    if (!this.categories.has(category.id)) {
      this.categories.set(category.id, category);
    }
  }

  setActionEnabled(actionId: string, enabled: boolean): boolean {
    const registered = this.actions.get(actionId);
    if (registered) {
      registered.enabled = enabled;
      return true;
    }
    return false;
  }

  isActionEnabled(actionId: string): boolean {
    const registered = this.actions.get(actionId);
    return registered ? registered.enabled : false;
  }

  getTotalActions(): number {
    let count = 0;
    this.actions.forEach((registered) => {
      if (registered.enabled) count++;
    });
    return count;
  }

  clear(): void {
    this.actions.clear();
  }
}
