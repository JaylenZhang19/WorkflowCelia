/**
 * Device Info Provider
 * Provides device information capabilities
 */
import { logger } from '../../utils/Logger';

export interface DeviceInfo {
  model: string;
  brand: string;
  osVersion: string;
  sdkVersion: number;
  screenWidth: number;
  screenHeight: number;
  screenDensity: number;
  language: string;
  region: string;
}

export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  connected: boolean;
  ssid?: string;
}

/**
 * Device Info Provider - simulates or accesses real device info
 */
export class DeviceInfoProvider {
  private static instance: DeviceInfoProvider;

  private constructor() {}

  static getInstance(): DeviceInfoProvider {
    if (!DeviceInfoProvider.instance) {
      DeviceInfoProvider.instance = new DeviceInfoProvider();
    }
    return DeviceInfoProvider.instance;
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    // TODO: Replace with real HarmonyOS device info API
    // system.getDeviceInfo()
    
    logger.info('DeviceInfoProvider', 'Retrieved device info');
    return {
      model: 'HarmonyOS Device',
      brand: 'Huawei',
      osVersion: '4.0',
      sdkVersion: 11,
      screenWidth: 1080,
      screenHeight: 2340,
      screenDensity: 3,
      language: 'zh-CN',
      region: 'CN'
    };
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    // TODO: Replace with real HarmonyOS network API
    // network.getConnectionType()
    
    const info = {
      type: 'wifi' as const,
      connected: true,
      ssid: 'MyWiFi'
    };
    logger.info('DeviceInfoProvider', `Network: ${info.type}, connected: ${info.connected}`);
    return info;
  }

  /**
   * Check if network is available
   */
  async isNetworkAvailable(): Promise<boolean> {
    const info = await this.getNetworkInfo();
    const available = info.connected && info.type !== 'none';
    logger.info('DeviceInfoProvider', `Network available: ${available}`);
    return available;
  }
}
