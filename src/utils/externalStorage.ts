import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EvidenceLevel } from '../domain/provenance/types';

const KEY = 'user_external_entities_v1';

export interface SourceInfo {
  sourceFile: string;
  count: number;
  totalChars: number;
  firstImportedAt: string;
  lastImportedAt: string;
  entityTypes: string[];
}

export interface UserEntity {
  id: string;
  evidenceLevel?: EvidenceLevel;
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

  async listSources(): Promise<SourceInfo[]> {
    const all = await this.getAll();
    return groupBySource(all);
  }

  async removeBySource(sourceFile: string): Promise<number> {
    const current = await this.getAll();
    const before = current.length;
    const next = current.filter((e) => e.sourceFile !== sourceFile);
    this.cache = next;
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return before - next.length;
  }

  invalidate(): void {
    this.cache = null;
  }
}

export const externalStorage = new ExternalStorage();

// ═══════════════════════════════════════════════════════════
// دوال مستقلة لتحليل المصادر
// ═══════════════════════════════════════════════════════════
export function groupBySource(entities: UserEntity[]): SourceInfo[] {
  const map = new Map<string, SourceInfo>();

  for (const e of entities) {
    const key = e.sourceFile ?? 'غير معروف';
    if (!map.has(key)) {
      map.set(key, {
        sourceFile: key,
        count: 0,
        totalChars: 0,
        firstImportedAt: e.importedAt,
        lastImportedAt: e.importedAt,
        entityTypes: [],
      });
    }
    const info = map.get(key)!;
    info.count += 1;
    info.totalChars += e.fullText.length;
    if (e.importedAt < info.firstImportedAt) info.firstImportedAt = e.importedAt;
    if (e.importedAt > info.lastImportedAt) info.lastImportedAt = e.importedAt;
    if (!info.entityTypes.includes(e.entityType)) {
      info.entityTypes.push(e.entityType);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.lastImportedAt.localeCompare(a.lastImportedAt)
  );
}
