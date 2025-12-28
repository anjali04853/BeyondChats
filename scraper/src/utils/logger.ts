export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  message: string;
  details?: Record<string, unknown>;
}

class Logger {
  private formatLogEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.operation}] ${entry.message}`;
    if (entry.details) {
      return `${base} ${JSON.stringify(entry.details)}`;
    }
    return base;
  }

  private log(level: LogLevel, operation: string, message: string, details?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message,
      details,
    };

    const formatted = this.formatLogEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    return entry;
  }

  debug(operation: string, message: string, details?: Record<string, unknown>): LogEntry {
    return this.log('debug', operation, message, details);
  }

  info(operation: string, message: string, details?: Record<string, unknown>): LogEntry {
    return this.log('info', operation, message, details);
  }

  warn(operation: string, message: string, details?: Record<string, unknown>): LogEntry {
    return this.log('warn', operation, message, details);
  }

  error(operation: string, message: string, details?: Record<string, unknown>): LogEntry {
    return this.log('error', operation, message, details);
  }
}

export const logger = new Logger();
