/**
 * Cross-Application Communication Protocol
 * Unified protocol for inter-app communication and ability invocation
 */

import { AbilityResult } from './IAbilityProvider';

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * Message types for cross-app communication
 */
export enum MessageType {
  /** Request to invoke an ability */
  INVOKE_REQUEST = 'invoke_request',
  /** Response from ability invocation */
  INVOKE_RESPONSE = 'invoke_response',
  /** Request to discover available abilities */
  DISCOVER_REQUEST = 'discover_request',
  /** Response with available abilities */
  DISCOVER_RESPONSE = 'discover_response',
  /** Request to check ability availability */
  AVAILABILITY_REQUEST = 'availability_request',
  /** Response with availability status */
  AVAILABILITY_RESPONSE = 'availability_response',
  /** Heartbeat message */
  HEARTBEAT = 'heartbeat',
  /** Error message */
  ERROR = 'error'
}

/**
 * Ability invocation request
 */
export interface InvokeRequest {
  type: MessageType.INVOKE_REQUEST;
  /** Request ID for correlation */
  requestId: string;
  /** Target bundle name */
  targetBundle: string;
  /** Target ability name */
  targetAbility: string;
  /** Action to invoke */
  action: string;
  /** Input parameters */
  inputs: Record<string, any>;
  /** Protocol version */
  version: string;
  /** Timestamp */
  timestamp: number;
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Ability invocation response
 */
export interface InvokeResponse {
  type: MessageType.INVOKE_RESPONSE;
  /** Correlated request ID */
  requestId: string;
  /** Whether invocation was successful */
  success: boolean;
  /** Ability result */
  result?: AbilityResult;
  /** Error information if failed */
  error?: ProtocolError;
  /** Timestamp */
  timestamp: number;
}

/**
 * Ability discovery request
 */
export interface DiscoverRequest {
  type: MessageType.DISCOVER_REQUEST;
  /** Request ID */
  requestId: string;
  /** Optional filter by category */
  category?: string;
  /** Optional filter by bundle */
  bundleFilter?: string;
  /** Protocol version */
  version: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Ability info for discovery response
 */
export interface AbilityInfo {
  /** Ability ID */
  id: string;
  /** Ability name */
  name: string;
  /** Bundle name */
  bundle: string;
  /** Category */
  category: string;
  /** Description */
  description: string;
  /** Version */
  version: string;
  /** Available */
  available: boolean;
}

/**
 * Ability discovery response
 */
export interface DiscoverResponse {
  type: MessageType.DISCOVER_RESPONSE;
  /** Correlated request ID */
  requestId: string;
  /** List of available abilities */
  abilities: AbilityInfo[];
  /** Timestamp */
  timestamp: number;
}

/**
 * Availability check request
 */
export interface AvailabilityRequest {
  type: MessageType.AVAILABILITY_REQUEST;
  /** Request ID */
  requestId: string;
  /** Target bundle name */
  targetBundle: string;
  /** Target ability name */
  targetAbility: string;
  /** Protocol version */
  version: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Availability check response
 */
export interface AvailabilityResponse {
  type: MessageType.AVAILABILITY_RESPONSE;
  /** Correlated request ID */
  requestId: string;
  /** Whether available */
  available: boolean;
  /** Reason if not available */
  reason?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Protocol error information
 */
export interface ProtocolError {
  /** Error code */
  code: ProtocolErrorCode;
  /** Error message */
  message: string;
  /** Additional details */
  details?: Record<string, any>;
}

/**
 * Protocol error codes
 */
export enum ProtocolErrorCode {
  /** Target app not found */
  TARGET_NOT_FOUND = 'TARGET_NOT_FOUND',
  /** Ability not found */
  ABILITY_NOT_FOUND = 'ABILITY_NOT_FOUND',
  /** Invalid parameters */
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  /** Permission denied */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** Timeout */
  TIMEOUT = 'TIMEOUT',
  /** Internal error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  /** Protocol version mismatch */
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  /** Target app not responding */
  TARGET_NOT_RESPONDING = 'TARGET_NOT_RESPONDING',
  /** User cancelled */
  USER_CANCELLED = 'USER_CANCELLED'
}

/**
 * Heartbeat message
 */
export interface HeartbeatMessage {
  type: MessageType.HEARTBEAT;
  /** Sender bundle */
  bundle: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Error message
 */
export interface ErrorMessage {
  type: MessageType.ERROR;
  /** Error */
  error: ProtocolError;
  /** Timestamp */
  timestamp: number;
}

/**
 * Union type for all message types
 */
export type ProtocolMessage =
  | InvokeRequest
  | InvokeResponse
  | DiscoverRequest
  | DiscoverResponse
  | AvailabilityRequest
  | AvailabilityResponse
  | HeartbeatMessage
  | ErrorMessage;

/**
 * Message sender interface
 */
export interface MessageSender {
  /**
   * Send a message to target
   * @param targetBundle - Target bundle name
   * @param message - Message to send
   * @returns Response message
   */
  send(targetBundle: string, message: ProtocolMessage): Promise<ProtocolMessage>;

  /**
   * Broadcast a message to all listeners
   * @param message - Message to broadcast
   */
  broadcast(message: ProtocolMessage): Promise<void>;

  /**
   * Register message handler
   * @param messageType - Type of message to handle
   * @param handler - Handler function
   */
  registerHandler(messageType: MessageType, handler: (message: ProtocolMessage) => Promise<ProtocolMessage>): void;

  /**
   * Unregister message handler
   * @param messageType - Type of message to unregister
   */
  unregisterHandler(messageType: MessageType): void;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create invoke request
 */
export function createInvokeRequest(
  targetBundle: string,
  targetAbility: string,
  action: string,
  inputs: Record<string, any>,
  timeout?: number
): InvokeRequest {
  return {
    type: MessageType.INVOKE_REQUEST,
    requestId: generateRequestId(),
    targetBundle,
    targetAbility,
    action,
    inputs,
    version: PROTOCOL_VERSION,
    timestamp: Date.now(),
    timeout
  };
}

/**
 * Create invoke response
 */
export function createInvokeResponse(
  requestId: string,
  result: AbilityResult,
  error?: ProtocolError
): InvokeResponse {
  return {
    type: MessageType.INVOKE_RESPONSE,
    requestId,
    success: result.success,
    result,
    error,
    timestamp: Date.now()
  };
}

/**
 * Create discover request
 */
export function createDiscoverRequest(category?: string, bundleFilter?: string): DiscoverRequest {
  return {
    type: MessageType.DISCOVER_REQUEST,
    requestId: generateRequestId(),
    category,
    bundleFilter,
    version: PROTOCOL_VERSION,
    timestamp: Date.now()
  };
}

/**
 * Create discover response
 */
export function createDiscoverResponse(requestId: string, abilities: AbilityInfo[]): DiscoverResponse {
  return {
    type: MessageType.DISCOVER_RESPONSE,
    requestId,
    abilities,
    timestamp: Date.now()
  };
}

/**
 * Serialize message to string for transmission
 */
export function serializeMessage(message: ProtocolMessage): string {
  return JSON.stringify(message);
}

/**
 * Deserialize message from string
 */
export function deserializeMessage(data: string): ProtocolMessage {
  return JSON.parse(data) as ProtocolMessage;
}
