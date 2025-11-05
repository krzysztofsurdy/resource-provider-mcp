import { Logger } from '../core/interfaces/Logger';

export class ConsoleLogger implements Logger {
  info(msg: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.log('[INFO]', msg, meta);
    } else {
      console.log('[INFO]', msg);
    }
  }

  warn(msg: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.warn('[WARN]', msg, meta);
    } else {
      console.warn('[WARN]', msg);
    }
  }

  error(msg: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.error('[ERROR]', msg, meta);
    } else {
      console.error('[ERROR]', msg);
    }
  }

  debug(msg: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.debug('[DEBUG]', msg, meta);
    } else {
      console.debug('[DEBUG]', msg);
    }
  }
}
