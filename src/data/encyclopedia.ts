// ================================================================
// الموسوعة الموحدة
// ================================================================

import { ROOTS_FULL_TEXT } from './fullRoots';
import resonanceData from './jafr_resonance.json';
import { REMEDIES_TYPES_FULL, IMBALANCE_REMEDIES_FULL } from './remedies';
import {
  getFullEncyclopedia,
  extractRootEncyclopedia,
  loadFullEncyclopedia,
} from './encyclopediaLoader';

// ═══════════════════════════════════════════════════════════════
// بيانات الجذور
// ═══════════════════════════════════════════════════════════════

export const getRootData = (rootNum: number): any => {
  const fullText = (ROOTS_FULL_TEXT as any)[rootNum];
  if (!fullText) return null;
  return { number: rootNum, fullText };
};

export const getRootFullText = (rootNum: number): string => {
  return (ROOTS_FULL_TEXT as any)[rootNum] || '';
};

// ═══════════════════════════════════════════════════════════════
// الرنين
// ═══════════════════════════════════════════════════════════════

export const getResonance = (key: string | number, key2?: number): any => {
  const resonanceMap = (resonanceData as any).rootResonance || {};
  if (key2 !== undefined) {
    const k = `${key}+${key2}`;
    const rk = `${key2}+${key}`;
    return resonanceMap[k] || resonanceMap[rk] || null;
  }
  return resonanceMap[String(key)] || null;
};

export const getResonanceBetween = (root1: number, root2: number): string => {
  const key = `${root1}+${root2}`;
  const reverseKey = `${root2}+${root1}`;
  const resonanceMap = (resonanceData as any).rootResonance || {};
  const found = resonanceMap[key] || resonanceMap[reverseKey];
  if (!found) return '';
  if (typeof found === 'string') return found;
  return `${found.description || ''}\n\nالظل: ${found.shadow || ''}\n\nالترياق: ${found.remedy || ''}`;
};

// ═══════════════════════════════════════════════════════════════
// الترياقات
// ═══════════════════════════════════════════════════════════════

export const getRemediesForRoot = (rootNum: number): any => {
  const rootRemedies: Record<number, string> = {
    1: 'الشراكة المنضبطة والاستماع والتواضع',
    2: 'تحديد الحدود والاستقلال العاطفي والحسم الهادئ',
    3: 'التثبيت والجدولة وتقليل المشتتات',
    4: 'مرونة محسوبة وتجديد تدريجي',
    5: 'تثبيت جزئي والتزام واحد رئيسي',
    6: 'حدود واضحة وتوزيع الأدوار وراحة منظمة',
    7: 'ربط التحليل بالفعل والخروج من العزلة',
    8: 'إنسانية القرار وتوزيع السلطة والرحمة',
    9: 'إنهاء الدورات بوضوح والاعتناء بالذات',
  };
  return {
    rootNum,
    remedy: rootRemedies[rootNum] || 'لا يوجد ترياق محدد',
    types: REMEDIES_TYPES_FULL,
    imbalance: IMBALANCE_REMEDIES_FULL,
  };
};

// ═══════════════════════════════════════════════════════════════
// الموسوعة الكبيرة
// ═══════════════════════════════════════════════════════════════

export const getEncyclopediaRootSection = (rootNum: number): string => {
  return extractRootEncyclopedia(rootNum);
};

export const ENCYCLOPEDIA_FULL_V2 = getFullEncyclopedia;
export const ENCYCLOPEDIA_CLEAN: any = {};
export const getEncyclopediaSection = (key: string): any => {
  const enc = getFullEncyclopedia();
  return enc[key] || null;
};
export const getEncyclopediaKeys = (): string[] => {
  const enc = getFullEncyclopedia();
  return Object.keys(enc);
};

export { loadFullEncyclopedia };
