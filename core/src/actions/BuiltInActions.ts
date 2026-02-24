/**
 * Built-in Actions Initializer
 */
import { ActionRegistry } from '../engine/ActionRegistry';
import { SCRIPTING_ACTIONS } from './ScriptingActions';
import { SYSTEM_ACTIONS } from './SystemActions';
import { PHOTOS_ACTIONS } from './PhotosActions';

export function initializeBuiltInActions(): void {
  const registry = ActionRegistry.getInstance();
  
  console.info('Initializing built-in actions...');

  SCRIPTING_ACTIONS.forEach(ActionClass => {
    const instance = new ActionClass();
    const definition = instance.getDefinition();
    registry.register(definition, instance);
    console.info(`Registered: ${definition.name}`);
  });

  SYSTEM_ACTIONS.forEach(ActionClass => {
    const instance = new ActionClass();
    const definition = instance.getDefinition();
    registry.register(definition, instance);
    console.info(`Registered: ${definition.name}`);
  });

  PHOTOS_ACTIONS.forEach(ActionClass => {
    const instance = new ActionClass();
    const definition = instance.getDefinition();
    registry.register(definition, instance);
    console.info(`Registered: ${definition.name}`);
  });

  const totalActions = registry.getTotalActions();
  console.info(`Built-in actions initialized. Total: ${totalActions} actions`);
}

export function getBuiltInActionsCount(): Record<string, number> {
  return {
    scripting: SCRIPTING_ACTIONS.length,
    photos: PHOTOS_ACTIONS.length,
    system: SYSTEM_ACTIONS.length,
    total: SCRIPTING_ACTIONS.length + PHOTOS_ACTIONS.length + SYSTEM_ACTIONS.length
  };
}
