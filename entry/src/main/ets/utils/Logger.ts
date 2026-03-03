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
  domain: number;        // Log domain (0xFFFF for app logs)
  prefix: string;        // Log prefix
  minLevel: LogLevel;    // Minimum log level to output
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  domain: 0xFFFF,
  prefix: 'Workflow',
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

  /**
   * Format log message
   */
  private formatMessage(tag: string, message: string): string {
    return `[${this.prefix}][${tag}] ${message}`;
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  /**
   * Debug log
   */
  debug(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    hilog.debug(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Info log
   */
  info(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    hilog.info(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Warn log
   */
  warn(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    hilog.warn(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Error log
   */
  error(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    hilog.error(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Fatal log
   */
  fatal(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    hilog.fatal(this.domain, tag, formattedMessage, ...args);
  }
}

/**
 * Default logger instance for Workflow app
 */
export const logger = new Logger({
  domain: 0xFFFF,
  prefix: 'Workflow',
  minLevel: LogLevel.DEBUG
});

/**
 * Create a logger for a specific module
 */
export function createLogger(prefix: string, minLevel: LogLevel = LogLevel.DEBUG): Logger {
  return new Logger({
    domain: 0xFFFF,
    prefix,
    minLevel
  });
}
