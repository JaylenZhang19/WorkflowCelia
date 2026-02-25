/**
 * Ability Communication Manager
 * Handles cross-application communication using HarmonyOS IPC mechanisms
 */

import { logger } from '../utils/Logger';
import {
  ProtocolMessage,
  MessageType,
  InvokeRequest,
  InvokeResponse,
  DiscoverRequest,
  DiscoverResponse,
  AvailabilityRequest,
  AvailabilityResponse,
  ProtocolError,
  ProtocolErrorCode,
  createInvokeResponse,
  createDiscoverResponse,
  generateRequestId
} from './AbilityCallProtocol';
import { IAbilityProvider, AbilityContext, AbilityResult } from './IAbilityProvider';
import { AbilityRegistry } from './AbilityRegistry';
import { DataType } from '../core/models/DataType';

/**
 * Communication Manager Configuration
 */
export interface CommunicationManagerConfig {
  /** Default timeout for remote calls in milliseconds */
  defaultTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Enable logging */
  enableLogging: boolean;
}

/**
 * Pending request tracker
 */
interface PendingRequest {
  requestId: string;
  resolve: (response: ProtocolMessage) => void;
  reject: (error: Error) => void;
  timeout: number;
  timer: number;
}

/**
 * Message handler function
 */
type MessageHandler = (message: ProtocolMessage) => Promise<ProtocolMessage>;

/**
 * Ability Communication Manager
 * Manages cross-application communication and ability invocation
 */
export class AbilityCommunicationManager {
  private static instance: AbilityCommunicationManager;
  
  private registry: AbilityRegistry;
  private config: CommunicationManagerConfig;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageHandlers: Map<MessageType, MessageHandler> = new Map();
  private isInitialized: boolean = false;

  private constructor(config?: Partial<CommunicationManagerConfig>) {
    this.registry = AbilityRegistry.getInstance();
    this.config = {
      defaultTimeout: 30000,
      maxRetries: 3,
      enableLogging: true,
      ...config
    };
  }

  static getInstance(config?: Partial<CommunicationManagerConfig>): AbilityCommunicationManager {
    if (!AbilityCommunicationManager.instance) {
      AbilityCommunicationManager.instance = new AbilityCommunicationManager(config);
    }
    return AbilityCommunicationManager.instance;
  }

  /**
   * Initialize the communication manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('AbilityCommunicationManager', 'Already initialized');
      return;
    }

    // Register message handlers
    this.registerHandler(MessageType.INVOKE_REQUEST, this.handleInvokeRequest.bind(this));
    this.registerHandler(MessageType.DISCOVER_REQUEST, this.handleDiscoverRequest.bind(this));
    this.registerHandler(MessageType.AVAILABILITY_REQUEST, this.handleAvailabilityRequest.bind(this));

    this.isInitialized = true;
    logger.info('AbilityCommunicationManager', 'Initialized');
  }

  /**
   * Register a message handler
   */
  registerHandler(messageType: MessageType, handler: MessageHandler): void {
    this.messageHandlers.set(messageType, handler);
    logger.debug('AbilityCommunicationManager', `Registered handler for ${messageType}`);
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(messageType: MessageType): void {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Invoke a remote ability
   * @param targetBundle - Target bundle name
   * @param targetAbility - Target ability name
   * @param action - Action to invoke
   * @param inputs - Input parameters
   * @param timeout - Optional timeout
   */
  async invokeAbility(
    targetBundle: string,
    targetAbility: string,
    action: string,
    inputs: Record<string, any>,
    timeout?: number
  ): Promise<AbilityResult> {
    const callTimeout = timeout || this.config.defaultTimeout;
    const requestId = generateRequestId();

    if (this.config.enableLogging) {
      logger.info('AbilityCommunicationManager', 
        `Invoking ability: ${targetBundle}/${targetAbility}/${action}`);
    }

    // Create invoke request
    const request: InvokeRequest = {
      type: MessageType.INVOKE_REQUEST,
      requestId,
      targetBundle,
      targetAbility,
      action,
      inputs,
      version: '1.0.0',
      timestamp: Date.now(),
      timeout: callTimeout
    };

    // Send request and wait for response
    try {
      const response = await this.sendRequest(request, callTimeout);
      
      if (response.type === MessageType.INVOKE_RESPONSE) {
        const invokeResponse = response as InvokeResponse;
        if (invokeResponse.success && invokeResponse.result) {
          return invokeResponse.result;
        } else if (invokeResponse.error) {
          throw new AbilityInvocationError(
            invokeResponse.error.message,
            invokeResponse.error.code,
            invokeResponse.error.details
          );
        }
      }

      throw new AbilityInvocationError(
        'Unexpected response type',
        ProtocolErrorCode.INTERNAL_ERROR
      );
    } catch (error) {
      if (error instanceof AbilityInvocationError) {
        throw error;
      }
      throw new AbilityInvocationError(
        error instanceof Error ? error.message : 'Unknown error',
        ProtocolErrorCode.INTERNAL_ERROR
      );
    }
  }

  /**
   * Discover available abilities
   * @param category - Optional category filter
   * @param bundleFilter - Optional bundle filter
   */
  async discoverAbilities(category?: string, bundleFilter?: string): Promise<any[]> {
    const requestId = generateRequestId();

    const request: DiscoverRequest = {
      type: MessageType.DISCOVER_REQUEST,
      requestId,
      category,
      bundleFilter,
      version: '1.0.0',
      timestamp: Date.now()
    };

    try {
      const response = await this.sendRequest(request, this.config.defaultTimeout);
      
      if (response.type === MessageType.DISCOVER_RESPONSE) {
        const discoverResponse = response as DiscoverResponse;
        return discoverResponse.abilities;
      }

      return [];
    } catch (error) {
      logger.error('AbilityCommunicationManager', `Discovery failed: ${error}`);
      return [];
    }
  }

  /**
   * Check ability availability
   * @param targetBundle - Target bundle name
   * @param targetAbility - Target ability name
   */
  async checkAvailability(targetBundle: string, targetAbility: string): Promise<boolean> {
    const requestId = generateRequestId();

    const request: AvailabilityRequest = {
      type: MessageType.AVAILABILITY_REQUEST,
      requestId,
      targetBundle,
      targetAbility,
      version: '1.0.0',
      timestamp: Date.now()
    };

    try {
      const response = await this.sendRequest(request, this.config.defaultTimeout);
      
      if (response.type === MessageType.AVAILABILITY_RESPONSE) {
        const availabilityResponse = response as AvailabilityResponse;
        return availabilityResponse.available;
      }

      return false;
    } catch (error) {
      logger.error('AbilityCommunicationManager', `Availability check failed: ${error}`);
      return false;
    }
  }

  /**
   * Send a request and wait for response
   */
  private sendRequest(request: ProtocolMessage, timeout: number): Promise<ProtocolMessage> {
    return new Promise((resolve, reject) => {
      const requestId = (request as InvokeRequest).requestId || 
                        (request as DiscoverRequest).requestId ||
                        (request as AvailabilityRequest).requestId;

      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request ${requestId} timed out after ${timeout}ms`));
      }, timeout);

      // Register pending request
      this.pendingRequests.set(requestId, {
        requestId,
        resolve,
        reject,
        timeout,
        timer
      });

      // TODO: Implement actual IPC sending via WantAgent/Want
      // For now, simulate by checking if target is local
      this.processRequestLocally(request).then(response => {
        this.completeRequest(requestId, response);
      }).catch(error => {
        this.completeRequest(requestId, {
          type: MessageType.ERROR,
          error: {
            code: ProtocolErrorCode.TARGET_NOT_FOUND,
            message: error.message
          },
          timestamp: Date.now()
        });
      });
    });
  }

  /**
   * Process request locally if target is registered
   */
  private async processRequestLocally(request: ProtocolMessage): Promise<ProtocolMessage> {
    if (request.type === MessageType.INVOKE_REQUEST) {
      const invokeRequest = request as InvokeRequest;
      const abilityId = `${invokeRequest.targetBundle}.${invokeRequest.targetAbility}.${invokeRequest.action}`;
      
      const provider = this.registry.getAbility(abilityId);
      if (!provider) {
        throw new Error(`Ability not found: ${abilityId}`);
      }

      const context: AbilityContext = {
        getVariable: (name: string) => null,
        setVariable: (name: string, value: any, dataType: DataType) => {},
        log: (level, message, data) => logger[level]('AbilityInvocation', message, data),
        isCancelled: () => false,
        requestConfirmation: async (message: string) => true
      };

      const result = await provider.execute(invokeRequest.inputs, context);
      
      return createInvokeResponse(invokeRequest.requestId, result);
    }

    if (request.type === MessageType.DISCOVER_REQUEST) {
      const discoverRequest = request as DiscoverRequest;
      const abilities = await this.registry.getAllAbilityInfo(
        discoverRequest.category,
        discoverRequest.bundleFilter
      );
      
      return createDiscoverResponse(discoverRequest.requestId, abilities);
    }

    if (request.type === MessageType.AVAILABILITY_REQUEST) {
      const availabilityRequest = request as AvailabilityRequest;
      const abilityId = `${availabilityRequest.targetBundle}.${availabilityRequest.targetAbility}`;
      
      const provider = this.registry.getAbility(abilityId);
      const available = provider ? await provider.isAvailable() : false;
      
      return {
        type: MessageType.AVAILABILITY_RESPONSE,
        requestId: availabilityRequest.requestId,
        available,
        timestamp: Date.now()
      };
    }

    throw new Error(`Unknown request type: ${request.type}`);
  }

  /**
   * Handle incoming invoke request
   */
  private async handleInvokeRequest(message: ProtocolMessage): Promise<ProtocolMessage> {
    const request = message as InvokeRequest;
    
    logger.info('AbilityCommunicationManager', 
      `Handling invoke request: ${request.targetBundle}/${request.targetAbility}/${request.action}`);

    // Find and execute the ability
    const abilityId = `${request.targetBundle}.${request.targetAbility}.${request.action}`;
    const provider = this.registry.getAbility(abilityId);

    if (!provider) {
      return createInvokeResponse(request.requestId, {
        success: false,
        error: 'Ability not found',
        errorCode: ProtocolErrorCode.ABILITY_NOT_FOUND
      }, {
        code: ProtocolErrorCode.ABILITY_NOT_FOUND,
        message: `Ability not found: ${abilityId}`
      });
    }

    const context: AbilityContext = {
      getVariable: (name: string) => null,
      setVariable: (name: string, value: any, dataType: DataType) => {},
      log: (level, message, data) => logger[level]('AbilityInvocation', message, data),
      isCancelled: () => false,
      requestConfirmation: async (message: string) => true
    };

    try {
      const result = await provider.execute(request.inputs, context);
      return createInvokeResponse(request.requestId, result);
    } catch (error) {
      return createInvokeResponse(request.requestId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: ProtocolErrorCode.INTERNAL_ERROR
      }, {
        code: ProtocolErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle incoming discover request
   */
  private async handleDiscoverRequest(message: ProtocolMessage): Promise<ProtocolMessage> {
    const request = message as DiscoverRequest;
    
    const abilities = await this.registry.getAllAbilityInfo(
      request.category,
      request.bundleFilter
    );

    return createDiscoverResponse(request.requestId, abilities);
  }

  /**
   * Handle incoming availability request
   */
  private async handleAvailabilityRequest(message: ProtocolMessage): Promise<ProtocolMessage> {
    const request = message as AvailabilityRequest;
    
    const abilityId = `${request.targetBundle}.${request.targetAbility}`;
    const provider = this.registry.getAbility(abilityId);
    const available = provider ? await provider.isAvailable() : false;

    return {
      type: MessageType.AVAILABILITY_RESPONSE,
      requestId: request.requestId,
      available,
      timestamp: Date.now()
    };
  }

  /**
   * Complete a pending request
   */
  private completeRequest(requestId: string, response: ProtocolMessage): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(requestId);
      pending.resolve(response);
    }
  }

  /**
   * Get communication statistics
   */
  getStats(): CommunicationStats {
    return {
      pendingRequests: this.pendingRequests.size,
      registeredHandlers: this.messageHandlers.size,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Dispose the manager
   */
  dispose(): void {
    // Clear all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Manager disposed'));
    }
    this.pendingRequests.clear();
    this.messageHandlers.clear();
    this.isInitialized = false;
    
    logger.info('AbilityCommunicationManager', 'Disposed');
  }
}

/**
 * Communication statistics
 */
export interface CommunicationStats {
  pendingRequests: number;
  registeredHandlers: number;
  isInitialized: boolean;
}

/**
 * Ability invocation error
 */
export class AbilityInvocationError extends Error {
  constructor(
    message: string,
    public code: ProtocolErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AbilityInvocationError';
  }
}
