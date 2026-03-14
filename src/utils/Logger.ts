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
  prefix: string;        // Log prefix
  minLevel: LogLevel;    // Minimum log level to output
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  prefix: 'Workflow',
  minLevel: LogLevel.DEBUG
};

/**
 * Logger class
 */
export class Logger {
  private prefix: string;
  private minLevel: LogLevel;

  constructor(config: Partial<LoggerConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
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
    console.debug(formattedMessage, ...args);
  }

  /**
   * Info log
   */
  info(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formattedMessage = this.formatMessage(tag, message);
    console.info(formattedMessage, ...args);
  }

  /**
   * Warn log
   */
  warn(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formattedMessage = this.formatMessage(tag, message);
    console.warn(formattedMessage, ...args);
  }

  /**
   * Error log
   */
  error(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const formattedMessage = this.formatMessage(tag, message);
    console.error(formattedMessage, ...args);
  }

  /**
   * Fatal log
   */
  fatal(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const formattedMessage = this.formatMessage(tag, message);
    console.error(formattedMessage, ...args);
  }
}


/**
 * Default logger instance for Workflow app
 */
export const logger = new Logger({
  prefix: 'Workflow',
  minLevel: LogLevel.DEBUG
});
