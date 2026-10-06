import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'error_log_v1';
const MAX = 100;

export interface LoggedError {
  id: string;
  ts: string;
  message: string;
  stack?: string;
  componentStack?: string;
  screen?: string;
  meta?: Record<string, any>;
}

class ErrorLogger {
  private cache: LoggedError[] = [];
  private loaded = false;

  async load(): Promise<LoggedError[]> {
    if (this.loaded) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.cache = raw ? JSON.parse(raw) : [];
    } catch {
      this.cache = [];
    }
    this.loaded = true;
    return this.cache;
  }

  async log(err: unknown, meta?: { screen?: string; componentStack?: string; meta?: Record<string, any> }): Promise<void> {
    try {
      const list = await this.load();
      const e: LoggedError = {
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ts: new Date().toISOString(),
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        componentStack: meta?.componentStack,
        screen: meta?.screen,
        meta: meta?.meta,
      };
      const next = [e, ...list].slice(0, MAX);
      this.cache = next;
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      console.log('🔴 [ErrorLogger]', e.message);
    } catch (e) {
      console.warn('⚠️ ErrorLogger.log failed:', e);
    }
  }

  async getAll(): Promise<LoggedError[]> {
    return await this.load();
  }

  async clear(): Promise<void> {
    this.cache = [];
    await AsyncStorage.removeItem(KEY);
  }

  async count(): Promise<number> {
    const list = await this.load();
    return list.length;
  }
}

export const errorLogger = new ErrorLogger();
