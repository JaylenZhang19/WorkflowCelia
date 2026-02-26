/**
 * AbilityLink SDK - IPC helpers
 * Shared IPC protocol and utilities
 */

import { common } from '@kit.AbilityKit';
import { rpc } from '@kit.IPCKit';
import { InvokeResult, RegistrationInfo } from './types';
import { logger } from './utils/Logger';

const TAG = 'AbilityLink.IPC';

export const ABILITY_LINK_REGISTRY_DESCRIPTOR = 'ability_link.registry';
export const ABILITY_LINK_PROVIDER_DESCRIPTOR = 'ability_link.provider';

export enum AbilityLinkIpcCode {
  REGISTER = 1,
  UNREGISTER = 2,
  INVOKE = 3,
  HEARTBEAT = 4
}

export interface AbilityLinkEndpoint {
  bundleName: string;
  abilityName: string;
}

export const DEFAULT_WORKFLOW_ENDPOINT: AbilityLinkEndpoint = {
  bundleName: 'com.pumpkin.workflowcelia',
  abilityName: 'AbilityLinkRegistryServiceAbility'
};

export interface AbilityLinkRegistrationRequest {
  registration: RegistrationInfo;
}

export interface AbilityLinkUnregisterRequest {
  bundleName: string;
}

export interface AbilityLinkHeartbeatRequest {
  bundleName: string;
  timestamp: number;
}

export interface AbilityLinkInvokeRequest {
  capabilityName: string;
  inputs: Record<string, any>;
}

export interface AbilityLinkBasicResponse {
  success: boolean;
  error?: string;
}

export interface AbilityLinkRegistryHandler {
  register(registration: RegistrationInfo): void;
  unregister?(bundleName: string): void;
  heartbeat?(bundleName: string, timestamp: number): void;
}

export class AbilityLinkRegistryStub extends rpc.RemoteObject {
  private handler: AbilityLinkRegistryHandler;

  constructor(handler: AbilityLinkRegistryHandler) {
    super(ABILITY_LINK_REGISTRY_DESCRIPTOR);
    this.handler = handler;
  }

  onRemoteMessageRequest(
    code: number,
    data: rpc.MessageSequence,
    reply: rpc.MessageSequence,
    option: rpc.MessageOption
  ): boolean | Promise<boolean> {
    try {
      switch (code) {
        case AbilityLinkIpcCode.REGISTER: {
          const request = readJson<AbilityLinkRegistrationRequest>(data);
          logger.info(TAG, `Registry register: ${request.registration.bundleName}`);
          this.handler.register(request.registration);
          writeJson(reply, { success: true } as AbilityLinkBasicResponse);
          return true;
        }
        case AbilityLinkIpcCode.UNREGISTER: {
          const request = readJson<AbilityLinkUnregisterRequest>(data);
          logger.info(TAG, `Registry unregister: ${request.bundleName}`);
          this.handler.unregister?.(request.bundleName);
          writeJson(reply, { success: true } as AbilityLinkBasicResponse);
          return true;
        }
        case AbilityLinkIpcCode.HEARTBEAT: {
          const request = readJson<AbilityLinkHeartbeatRequest>(data);
          logger.debug(TAG, `Registry heartbeat: ${request.bundleName}`);
          this.handler.heartbeat?.(request.bundleName, request.timestamp);
          writeJson(reply, { success: true } as AbilityLinkBasicResponse);
          return true;
        }
        default:
          writeJson(reply, { success: false, error: `Unknown code: ${code}` } as AbilityLinkBasicResponse);
          return false;
      }
    } catch (error) {
      logger.error(TAG, `Registry stub error: ${JSON.stringify(error)}`);
      writeJson(reply, { success: false, error: 'Registry stub error' } as AbilityLinkBasicResponse);
      return false;
    }
  }
}

export class AbilityLinkProviderStub extends rpc.RemoteObject {
  private provider: AbilityLinkProviderLike;

  constructor(provider: AbilityLinkProviderLike) {
    super(ABILITY_LINK_PROVIDER_DESCRIPTOR);
    this.provider = provider;
  }

  async onRemoteMessageRequest(
    code: number,
    data: rpc.MessageSequence,
    reply: rpc.MessageSequence,
    option: rpc.MessageOption
  ): Promise<boolean> {
    if (code !== AbilityLinkIpcCode.INVOKE) {
      writeJson(reply, {
        success: false,
        error: `Unknown code: ${code}`,
        errorCode: 'UNKNOWN_CODE'
      } as InvokeResult);
      return false;
    }

    try {
      const request = readJson<AbilityLinkInvokeRequest>(data);
      logger.info(TAG, `Provider invoke: ${request.capabilityName}`);
      const result = await this.provider.invoke(request.capabilityName, request.inputs);
      writeJson(reply, result);
      return true;
    } catch (error) {
      logger.error(TAG, `Provider stub error: ${JSON.stringify(error)}`);
      writeJson(reply, {
        success: false,
        error: error instanceof Error ? error.message : 'Invocation error',
        errorCode: 'INVOCATION_ERROR'
      } as InvokeResult);
      return true;
    }
  }
}

export class AbilityLinkIpcClient {
  private context: common.UIAbilityContext;

  constructor(context: common.UIAbilityContext) {
    this.context = context;
  }

  async request<TResponse>(
    endpoint: AbilityLinkEndpoint,
    code: AbilityLinkIpcCode,
    payload: Record<string, any>,
    timeoutMs: number
  ): Promise<TResponse> {
    const { proxy, connectId } = await this.connect(endpoint, timeoutMs);
    try {
      return await this.sendRequest<TResponse>(proxy, code, payload, timeoutMs);
    } finally {
      this.disconnect(connectId);
    }
  }

  private connect(endpoint: AbilityLinkEndpoint, timeoutMs: number): Promise<{ proxy: rpc.IRemoteObject; connectId: number }> {
    const connectPromise = new Promise<{ proxy: rpc.IRemoteObject; connectId: number }>((resolve, reject) => {
      let connectId = -1;
      const want = {
        bundleName: endpoint.bundleName,
        abilityName: endpoint.abilityName
      };

      const connect: common.ConnectOptions = {
        onConnect: (elementName, remoteProxy) => {
          if (!remoteProxy) {
            reject(new Error('Remote proxy not available'));
            return;
          }
          logger.debug(TAG, `IPC connected: ${endpoint.bundleName}/${endpoint.abilityName}`);
          resolve({ proxy: remoteProxy, connectId });
        },
        onDisconnect: () => {
          logger.info(TAG, `IPC disconnected: ${endpoint.bundleName}/${endpoint.abilityName}`);
        },
        onFailed: () => {
          reject(new Error('IPC connect failed'));
        }
      };

      try {
        connectId = this.context.connectServiceExtensionAbility(want, connect);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('IPC connect error'));
      }
    });

    return this.withTimeout(connectPromise, timeoutMs, 'IPC connect timeout');
  }

  private async sendRequest<TResponse>(
    proxy: rpc.IRemoteObject,
    code: AbilityLinkIpcCode,
    payload: Record<string, any>,
    timeoutMs: number
  ): Promise<TResponse> {
    const data = rpc.MessageSequence.create();
    const reply = rpc.MessageSequence.create();
    const option = new rpc.MessageOption();

    try {
      writeJson(data, payload);
      const response = await this.withTimeout(
        proxy.sendMessageRequest(code, data, reply, option),
        timeoutMs,
        'IPC request timeout'
      );

      if (response.errCode !== 0) {
        throw new Error(`IPC request failed, errCode: ${response.errCode}`);
      }

      return readJson<TResponse>(response.reply);
    } finally {
      data.reclaim();
      reply.reclaim();
    }
  }

  private disconnect(connectId: number): void {
      if (connectId >= 0) {
        try {
          this.context.disconnectServiceExtensionAbility(connectId);
        } catch (error) {
          logger.warn(TAG, `IPC disconnect error: ${JSON.stringify(error)}`);
        }
      }
    }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

export function writeJson(target: rpc.MessageSequence, payload: Record<string, any> | InvokeResult | AbilityLinkBasicResponse): void {
  target.writeString(JSON.stringify(payload ?? {}));
}

export function readJson<T>(source: rpc.MessageSequence): T {
  const raw = source.readString();
  if (!raw) {
    return {} as T;
  }
  return JSON.parse(raw) as T;
}

export interface AbilityLinkProviderLike {
  invoke(capabilityName: string, inputs: Record<string, any>): Promise<InvokeResult>;
}

export class AbilityLinkRegistrar {
  private client: AbilityLinkIpcClient;
  private endpoint: AbilityLinkEndpoint;
  private timeoutMs: number;

  constructor(
    context: common.UIAbilityContext,
    endpoint: AbilityLinkEndpoint = DEFAULT_WORKFLOW_ENDPOINT,
    timeoutMs: number = 10000
  ) {
    this.client = new AbilityLinkIpcClient(context);
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
  }

  async register(registration: RegistrationInfo): Promise<AbilityLinkBasicResponse> {
    return this.client.request<AbilityLinkBasicResponse>(
      this.endpoint,
      AbilityLinkIpcCode.REGISTER,
      { registration },
      this.timeoutMs
    );
  }

  async unregister(bundleName: string): Promise<AbilityLinkBasicResponse> {
    return this.client.request<AbilityLinkBasicResponse>(
      this.endpoint,
      AbilityLinkIpcCode.UNREGISTER,
      { bundleName },
      this.timeoutMs
    );
  }

  async heartbeat(bundleName: string, timestamp: number = Date.now()): Promise<AbilityLinkBasicResponse> {
    return this.client.request<AbilityLinkBasicResponse>(
      this.endpoint,
      AbilityLinkIpcCode.HEARTBEAT,
      { bundleName, timestamp },
      this.timeoutMs
    );
  }
}
