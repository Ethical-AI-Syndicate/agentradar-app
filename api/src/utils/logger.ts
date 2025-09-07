import { format } from 'util';

export interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

class ConsoleLogger implements Logger {

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 ? format(message, ...args) : message;
    return `[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('info', message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message, ...args));
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this.formatMessage('debug', message, ...args));
  }
}

export function createLogger(): Logger {
  return new ConsoleLogger();
}