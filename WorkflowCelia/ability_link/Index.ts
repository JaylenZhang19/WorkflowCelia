/**
 * AbilityLink SDK
 * Cross-application capability registration and IPC invocation framework
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
  createAbilityLinkMetadata,
  createProviderStub
} from './src/main/ets/ProviderHelper';

// Consumer
export { AbilityLinkConsumer } from './src/main/ets/Consumer';

// IPC helpers
export {
  AbilityLinkIpcCode,
  AbilityLinkEndpoint,
  DEFAULT_WORKFLOW_ENDPOINT,
  AbilityLinkRegistrationRequest,
  AbilityLinkUnregisterRequest,
  AbilityLinkHeartbeatRequest,
  AbilityLinkInvokeRequest,
  AbilityLinkBasicResponse,
  AbilityLinkRegistryHandler,
  AbilityLinkRegistryStub,
  AbilityLinkProviderStub,
  AbilityLinkIpcClient,
  AbilityLinkRegistrar
} from './src/main/ets/Ipc';
