// ================================================================
// محوّل التخزين - يستخدم AsyncStorage للبيانات الصغيرة
// ================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@jafr_kb:';

export class AsyncStorageAdapter {
  /**
   * حفظ عنصر
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem(KEY_PREFIX + key, json);
    } catch (error) {
      console.error(`[KB Storage] فشل حفظ ${key}:`, error);
      throw error;
    }
  }

  /**
   * قراءة عنصر
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const json = await AsyncStorage.getItem(KEY_PREFIX + key);
      if (!json) return null;
      return JSON.parse(json) as T;
    } catch (error) {
      console.error(`[KB Storage] فشل قراءة ${key}:`, error);
      return null;
    }
  }

  /**
   * حذف عنصر
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY_PREFIX + key);
    } catch (error) {
      console.error(`[KB Storage] فشل حذف ${key}:`, error);
    }
  }

  /**
   * حذف كل شيء (للاختبار)
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const kbKeys = keys.filter(k => k.startsWith(KEY_PREFIX));
      await AsyncStorage.multiRemove(kbKeys);
      console.log('🗑️ تم حذف كل بيانات KB');
    } catch (error) {
      console.error('[KB Storage] فشل الحذف:', error);
    }
  }

  /**
   * الحصول على جميع المفاتيح
   */
  async keys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(k => k.startsWith(KEY_PREFIX))
        .map(k => k.replace(KEY_PREFIX, ''));
    } catch (error) {
      return [];
    }
  }
}

export const kbStorage = new AsyncStorageAdapter();
