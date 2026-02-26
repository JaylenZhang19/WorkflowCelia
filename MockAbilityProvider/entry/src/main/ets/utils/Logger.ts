/**
 * Logger Utility
 * Unified logging utility using HarmonyOS hilog
 */
import { hilog } from '@kit.PerformanceAnalysisKit';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 3,
  INFO = 4,
  WARN = 5,
  ERROR = 6,
  FATAL = 7
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  domain: number;
  prefix: string;
  minLevel: LogLevel;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  domain: 0xFFFF,
  prefix: 'MockAbility',
  minLevel: LogLevel.DEBUG
};

/**
 * Logger class
 */
export class Logger {
  private domain: number;
  private prefix: string;
  private minLevel: LogLevel;

  constructor(config: Partial<LoggerConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    this.domain = finalConfig.domain;
    this.prefix = finalConfig.prefix;
    this.minLevel = finalConfig.minLevel;
  }

  private formatMessage(tag: string, message: string): string {
    return `[${this.prefix}][${tag}] ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  debug(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    hilog.debug(this.domain, tag, this.formatMessage(tag, message), ...args);
  }

  info(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    hilog.info(this.domain, tag, this.formatMessage(tag, message), ...args);
  }

  warn(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    hilog.warn(this.domain, tag, this.formatMessage(tag, message), ...args);
  }

  error(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    hilog.error(this.domain, tag, this.formatMessage(tag, message), ...args);
  }

  fatal(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    hilog.fatal(this.domain, tag, this.formatMessage(tag, message), ...args);
  }
}

/**
 * Default logger instance for MockAbilityProvider app
 */
export const logger = new Logger({
  domain: 0xFFFF,
  prefix: 'MockAbility',
  minLevel: LogLevel.DEBUG
});
