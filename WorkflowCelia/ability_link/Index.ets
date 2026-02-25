/**
 * AbilityLink SDK
 * Cross-application capability discovery and invocation framework
 *
 * @module ability_link
 */

// Core types
export {
  AbilityLinkCapability,
  AbilityCategory,
  CapabilityParameter,
  CapabilityDataType,
  ParameterValidation,
  RegisteredCapability,
  RegistrationInfo,
  InvokeResult,
  AbilityLinkConfig,
  AbilityLinkEvent,
  EventListener,
  InitResult,
  DEFAULT_CONFIG
} from './src/main/ets/types';

// Provider helper
export {
  AbilityLinkProvider,
  MultiCapabilityProvider,
  ProviderInfo,
  AbilityLinkMetadata,
  createAbilityLinkMetadata
} from './src/main/ets/ProviderHelper';

// Consumer
export { AbilityLinkConsumer } from './src/main/ets/Consumer';
