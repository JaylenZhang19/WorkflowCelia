/**
 * Battery Provider
 * Provides battery status capabilities
 */
import { logger } from '../../utils/Logger';

export interface BatteryStatus {
  level: number;        // 0-100
  charging: boolean;
  chargingTime?: number;    // seconds until full
  dischargingTime?: number; // seconds until empty
}

/**
 * Battery Provider - simulates or accesses real battery status
 */
export class BatteryProvider {
  private static instance: BatteryProvider;
  private mockStatus: BatteryStatus = {
    level: 75,
    charging: false
  };

  private constructor() {}

  static getInstance(): BatteryProvider {
    if (!BatteryProvider.instance) {
      BatteryProvider.instance = new BatteryProvider();
    }
    return BatteryProvider.instance;
  }

  /**
   * Get current battery status
   */
  async getBatteryStatus(): Promise<BatteryStatus> {
    // TODO: Replace with real HarmonyOS battery API
    // power.getBatteryInfo()
    
    logger.info('BatteryProvider', `Battery level: ${this.mockStatus.level}%, charging: ${this.mockStatus.charging}`);
    return { ...this.mockStatus };
  }

  /**
   * Check if device is charging
   */
  async isCharging(): Promise<boolean> {
    const status = await this.getBatteryStatus();
    logger.info('BatteryProvider', `Is charging: ${status.charging}`);
    return status.charging;
  }

  /**
   * Check if battery is low (below 20%)
   */
  async isBatteryLow(): Promise<boolean> {
    const status = await this.getBatteryStatus();
    const isLow = status.level < 20;
    logger.info('BatteryProvider', `Battery low: ${isLow} (level: ${status.level}%)`);
    return isLow;
  }

  /**
   * Set mock battery status for testing
   */
  setMockStatus(level: number, charging: boolean): void {
    this.mockStatus = { level, charging };
    logger.info('BatteryProvider', `Mock battery status set: level=${level}%, charging=${charging}`);
  }
}
