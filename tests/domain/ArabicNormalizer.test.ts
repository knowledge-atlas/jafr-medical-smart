// ================================================================
// اختبارات ArabicNormalizer
// 20 حالة اختبار شاملة
// ================================================================

import { describe, it, expect } from 'vitest';
import { arabicNormalizer } from '../../src/domain/services/ArabicNormalizer';

describe('ArabicNormalizer', () => {
  describe('normalizeAlef', () => {
    it('should normalize أ to ا', () => {
      expect(arabicNormalizer.normalizeAlef('أحمد')).toBe('احمد');
    });

    it('should normalize إ to ا', () => {
      expect(arabicNormalizer.normalizeAlef('إبراهيم')).toBe('ابراهيم');
    });

    it('should normalize آ to ا', () => {
      expect(arabicNormalizer.normalizeAlef('آمنة')).toBe('امنة');
    });

    it('should normalize ٱ to ا', () => {
      expect(arabicNormalizer.normalizeAlef('ٱلله')).toBe('الله');
    });
  });

  describe('normalizeYaa', () => {
    it('should normalize ى to ي', () => {
      expect(arabicNormalizer.normalizeYaa('مصطفى')).toBe('مصطفي');
    });
  });

  describe('normalizeTaaMarbuta', () => {
    it('should normalize ة to ه', () => {
      expect(arabicNormalizer.normalizeTaaMarbuta('فاطمة')).toBe('فاطمه');
    });
  });

  describe('removeTashkeel', () => {
    it('should remove fatha', () => {
      expect(arabicNormalizer.removeTashkeel('مُحَمَّد')).toBe('محمد');
    });

    it('should remove tanween', () => {
      expect(arabicNormalizer.removeTashkeel('كِتَابًا')).toBe('كتابا');
    });

    it('should remove shadda', () => {
      expect(arabicNormalizer.removeTashkeel('شدَّة')).toBe('شدة');
    });
  });

  describe('removeTatweel', () => {
    it('should remove tatweel', () => {
      expect(arabicNormalizer.removeTatweel('محـــمد')).toBe('محمد');
    });
  });

  describe('collapseDuplicates', () => {
    it('should collapse triple letters', () => {
      expect(arabicNormalizer.collapseDuplicates('محممممد')).toBe('محمد');
    });

    it('should keep double letters', () => {
      expect(arabicNormalizer.collapseDuplicates('محمد')).toBe('محمد');
    });
  });

  describe('removeAlTaarif', () => {
    it('should remove al-ta3rif', () => {
      expect(arabicNormalizer.removeAlTaarif('الحسن')).toBe('حسن');
    });

    it('should not remove from short words', () => {
      expect(arabicNormalizer.removeAlTaarif('الي')).toBe('الي');
    });
  });

  describe('normalize (full pipeline)', () => {
    it('should handle complex case', () => {
      expect(arabicNormalizer.normalize('أَحْمَد')).toBe('احمد');
    });

    it('should handle fatima with taa marbuta', () => {
      expect(arabicNormalizer.normalize('فَاطِمَة')).toBe('فاطمه');
    });

    it('should handle mustafa with yaa maqsura', () => {
      expect(arabicNormalizer.normalize('مُصْطَفَى')).toBe('مصطفي');
    });

    it('should collapse duplicates when requested', () => {
      expect(arabicNormalizer.normalize('محممممد', { collapseDuplicates: true })).toBe('محمد');
    });

    it('should remove al-ta3rif when requested', () => {
      expect(arabicNormalizer.normalize('الحسن', { removeAlTaarif: true })).toBe('حسن');
    });
  });

  describe('isArabic', () => {
    it('should detect arabic text', () => {
      expect(arabicNormalizer.isArabic('محمد')).toBe(true);
    });

    it('should reject latin text', () => {
      expect(arabicNormalizer.isArabic('Mohammed')).toBe(false);
    });

    it('should reject mixed', () => {
      expect(arabicNormalizer.isArabic('محمد123')).toBe(false);
    });
  });

  describe('analyze', () => {
    it('should report transformations', () => {
      const result = arabicNormalizer.analyze('أَحْمَد');
      expect(result.original).toBe('أَحْمَد');
      expect(result.normalized).toBe('احمد');
      expect(result.transformations.length).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
      const result = arabicNormalizer.analyze('');
      expect(result.normalized).toBe('');
      expect(result.transformations).toEqual([]);
    });
  });

  describe('areEquivalent', () => {
    it('should consider أحمد and احمد equivalent', () => {
      expect(arabicNormalizer.areEquivalent('أحمد', 'احمد')).toBe(true);
    });

    it('should consider فاطمة and فاطمه equivalent', () => {
      expect(arabicNormalizer.areEquivalent('فاطمة', 'فاطمه')).toBe(true);
    });
  });
});
