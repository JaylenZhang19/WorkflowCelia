/**
 * Logger Utility
 * Unified logging utility across HarmonyOS and Node.js
 */
import { ProjectContext, detectRuntime, RuntimeEnv } from '../env/ProjectContext';

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
  private adapter: LogAdapter | null = null;
  private adapterRuntime: RuntimeEnv | null = null;

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

  private resolveRuntime(): RuntimeEnv {
    const ctx = ProjectContext.getInstanceOptional();
    return ctx?.runtime ?? detectRuntime();
  }

  private getAdapter(): LogAdapter {
    const runtime = this.resolveRuntime();
    if (this.adapter && this.adapterRuntime === runtime) {
      return this.adapter;
    }
    this.adapterRuntime = runtime;
    if (runtime === 'harmony') {
      const hilog = tryLoadHilog();
      if (hilog) {
        this.adapter = new HilogAdapter(hilog);
        return this.adapter;
      }
    }
    this.adapter = new ConsoleAdapter();
    return this.adapter;
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
    this.getAdapter().debug(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Info log
   */
  info(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    this.getAdapter().info(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Warn log
   */
  warn(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    this.getAdapter().warn(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Error log
   */
  error(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    this.getAdapter().error(this.domain, tag, formattedMessage, ...args);
  }

  /**
   * Fatal log
   */
  fatal(tag: string, message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    
    const formattedMessage = this.formatMessage(tag, message);
    this.getAdapter().fatal(this.domain, tag, formattedMessage, ...args);
  }
}

interface LogAdapter {
  debug(domain: number, tag: string, message: string, ...args: any[]): void;
  info(domain: number, tag: string, message: string, ...args: any[]): void;
  warn(domain: number, tag: string, message: string, ...args: any[]): void;
  error(domain: number, tag: string, message: string, ...args: any[]): void;
  fatal(domain: number, tag: string, message: string, ...args: any[]): void;
}

class ConsoleAdapter implements LogAdapter {
  debug(_domain: number, _tag: string, message: string, ...args: any[]): void {
    console.debug(message, ...args);
  }
  info(_domain: number, _tag: string, message: string, ...args: any[]): void {
    console.info(message, ...args);
  }
  warn(_domain: number, _tag: string, message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }
  error(_domain: number, _tag: string, message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
  fatal(_domain: number, _tag: string, message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
}

class HilogAdapter implements LogAdapter {
  private hilog: any;

  constructor(hilog: any) {
    this.hilog = hilog;
  }

  debug(domain: number, tag: string, message: string, ...args: any[]): void {
    this.hilog.debug(domain, tag, message, ...args);
  }
  info(domain: number, tag: string, message: string, ...args: any[]): void {
    this.hilog.info(domain, tag, message, ...args);
  }
  warn(domain: number, tag: string, message: string, ...args: any[]): void {
    this.hilog.warn(domain, tag, message, ...args);
  }
  error(domain: number, tag: string, message: string, ...args: any[]): void {
    this.hilog.error(domain, tag, message, ...args);
  }
  fatal(domain: number, tag: string, message: string, ...args: any[]): void {
    this.hilog.fatal(domain, tag, message, ...args);
  }
}

function tryLoadHilog(): any | null {
  try {
    const g: any = globalThis as any;
    if (g?.hilog) return g.hilog;
    const req = g?.require;
    if (typeof req === 'function') {
      const kit = req('@kit.PerformanceAnalysisKit');
      return kit?.hilog ?? null;
    }
  } catch {
    return null;
  }
  return null;
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
