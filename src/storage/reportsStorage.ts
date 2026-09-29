// ================================================================
// تخزين التقارير — AsyncStorage
// ================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'jafr_reports_v1';
const MAX_REPORTS = 100;

export interface SavedReport {
  id: string;
  name: string;
  symptoms: string[];
  root: number;
  planet: string;
  sign: string;
  element: string;
  house: number;
  total: number;
  fullText: string;
  report: any;
  createdAt: string;
}

export class ReportsStorage {
  /**
   * حفظ تقرير جديد
   */
  async save(report: SavedReport): Promise<void> {
    try {
      const all = await this.getAll();
      all.unshift(report); // الأحدث أولاً
      // حذف الأقدم إن تجاوزنا الحد
      const trimmed = all.slice(0, MAX_REPORTS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('❌ فشل حفظ التقرير:', e);
      throw e;
    }
  }

  /**
   * الحصول على كل التقارير
   */
  async getAll(): Promise<SavedReport[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('❌ فشل قراءة التقارير:', e);
      return [];
    }
  }

  /**
   * الحصول على تقرير واحد
   */
  async getById(id: string): Promise<SavedReport | null> {
    const all = await this.getAll();
    return all.find(r => r.id === id) || null;
  }

  /**
   * حذف تقرير
   */
  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * مسح كل التقارير
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * عدد التقارير
   */
  async count(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  }
}

export const reportsStorage = new ReportsStorage();
