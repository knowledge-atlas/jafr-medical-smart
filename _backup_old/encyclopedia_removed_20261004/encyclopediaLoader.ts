// ================================================================
// محمّل الموسوعة الكبيرة من assets/
// يُحمّل مرة واحدة عند بدء التطبيق ويحفظها في الذاكرة
// ================================================================

import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

let cachedFull: any = null;
let cachedClean: any = null;
let loadPromise: Promise<any> | null = null;

/**
 * تحميل الموسوعة الكاملة (505KB) من assets/
 */
export const loadFullEncyclopedia = async (): Promise<any> => {
  if (cachedFull) return cachedFull;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      console.log('📚 تحميل الموسوعة الكبيرة...');
      const asset = Asset.fromModule(
        require('../../assets/jafr_encyclopedia_FULL_v2.json')
      );
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      const uri = asset.localUri || asset.uri;
      const content = await FileSystem.readAsStringAsync(uri);
      cachedFull = JSON.parse(content);
      console.log('✅ تم تحميل الموسوعة الكبيرة');
      return cachedFull;
    } catch (e: any) {
      console.warn('⚠️ فشل تحميل الموسوعة الكبيرة:', e?.message);
      cachedFull = {};
      return cachedFull;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
};

/**
 * تحميل الموسوعة النظيفة (56KB)
 */
export const loadCleanEncyclopedia = async (): Promise<any> => {
  if (cachedClean) return cachedClean;
  try {
    const asset = Asset.fromModule(
      require('../../assets/jafr_encyclopedia_CLEAN.json')
    );
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    const uri = asset.localUri || asset.uri;
    const content = await FileSystem.readAsStringAsync(uri);
    cachedClean = JSON.parse(content);
    return cachedClean;
  } catch (e: any) {
    console.warn('⚠️ فشل تحميل الموسوعة النظيفة:', e?.message);
    cachedClean = {};
    return cachedClean;
  }
};

/**
 * إرجاع الموسوعة المحملة (بعد await)
 */
export const getFullEncyclopedia = (): any => cachedFull || {};
export const getCleanEncyclopedia = (): any => cachedClean || {};

/**
 * البحث الذكي عن محتوى متعلق بمفتاح معين (مثل "root_2")
 * يبحث في كل مستويات الكائن بشكل متكرر
 */
export const findEncyclopediaContent = (
  obj: any,
  searchKeys: string[],
  maxResults: number = 50
): { path: string; value: any }[] => {
  const results: { path: string; value: any }[] = [];

  const search = (current: any, path: string) => {
    if (results.length >= maxResults) return;
    if (current === null || current === undefined) return;

    if (typeof current === 'string') {
      // نتائج نصية
      const lower = current.toLowerCase();
      if (searchKeys.some(k => lower.includes(k.toLowerCase()) || path.toLowerCase().includes(k.toLowerCase()))) {
        results.push({ path, value: current });
      }
      return;
    }

    if (Array.isArray(current)) {
      current.forEach((item, idx) => search(item, `${path}[${idx}]`));
      return;
    }

    if (typeof current === 'object') {
      for (const key of Object.keys(current)) {
        const lowerKey = key.toLowerCase();
        const matched = searchKeys.some(k => lowerKey.includes(k.toLowerCase()));
        if (matched) {
          results.push({ path: `${path}.${key}`, value: current[key] });
        }
        search(current[key], `${path}.${key}`);
      }
    }
  };

  search(obj, '$');
  return results;
};

/**
 * استخراج كل الفقرات المتعلقة بجذر معين
 */
export const extractRootEncyclopedia = (rootNum: number): string => {
  const encyclopedia = getFullEncyclopedia();
  if (!encyclopedia || Object.keys(encyclopedia).length === 0) {
    return '';
  }

  const searchKeys = [
    `root_${rootNum}`,
    `root${rootNum}`,
    `الجذر ${rootNum}`,
    `الجذر_${rootNum}`,
    `ROOT_${rootNum}`,
  ];

  const results = findEncyclopediaContent(encyclopedia, searchKeys, 100);
  if (results.length === 0) return '';

  // دمج النصوص الفريدة
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const r of results) {
    const text = typeof r.value === 'string'
      ? r.value
      : JSON.stringify(r.value, null, 2);
    if (text.length < 20) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    parts.push(text);
  }

  return parts.join('\n\n────────────────\n\n');
};
