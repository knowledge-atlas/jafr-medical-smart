import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'user_external_entities_v1';

export interface UserEntity {
  id: string;
  entityType: string;
  entityNumber?: number;
  titleAr: string;
  fullText: string;
  summary?: string;
  keywords: string[];
  sourceFile: string;
  importedAt: string;
  metadata?: Record<string, any>;
}

class ExternalStorage {
  private cache: UserEntity[] | null = null;

  async getAll(): Promise<UserEntity[]> {
    if (this.cache !== null) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.cache = raw ? JSON.parse(raw) : [];
    } catch {
      this.cache = [];
    }
    return this.cache as UserEntity[];
  }

  async addMany(items: UserEntity[]): Promise<number> {
    const current = await this.getAll();
    const existingIds = new Set(current.map((e) => e.id));
    const fresh = items.filter((e) => !existingIds.has(e.id));
    const next = [...current, ...fresh];
    this.cache = next;
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return fresh.length;
  }

  async remove(id: string): Promise<void> {
    const current = await this.getAll();
    const next = current.filter((e) => e.id !== id);
    this.cache = next;
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  async clear(): Promise<void> {
    this.cache = [];
    await AsyncStorage.removeItem(KEY);
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  invalidate(): void {
    this.cache = null;
  }
}

export const externalStorage = new ExternalStorage();
