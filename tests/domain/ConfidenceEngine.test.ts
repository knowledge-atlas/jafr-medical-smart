// ================================================================
// اختبارات ConfidenceEngine
// ================================================================

import { describe, it, expect } from 'vitest';
import { confidenceEngine, ConfidenceInput } from '../../src/domain/services/ConfidenceEngine';

describe('ConfidenceEngine', () => {
  const baseInput: ConfidenceInput = {
    name: 'محمد',
    letters: ['م', 'ح', 'م', 'د'],
    root: 2,
    planet: 'القمر',
    sign: 'السرطان',
    element: 'ماء',
    house: 4,
    resonance: { description: 'رنين موزون', compatibleWith: [4, 6] },
    wafq: [[4, 9, 2], [3, 5, 7], [8, 1, 6]],
  };

  describe('calculate (full)', () => {
    it('should return a complete result', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
      expect(result.level).toBeTruthy();
      expect(result.levelId).toBeGreaterThanOrEqual(0);
      expect(result.breakdown).toBeTruthy();
    });

    it('should have all 6 breakdown components', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.breakdown.inputQuality).toBeDefined();
      expect(result.breakdown.dataCompleteness).toBeDefined();
      expect(result.breakdown.layerConsistency).toBeDefined();
      expect(result.breakdown.resonanceStrength).toBeDefined();
      expect(result.breakdown.wafqClarity).toBeDefined();
      expect(result.breakdown.verificationHistory).toBeDefined();
    });

    it('should give high confidence for consistent input', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.total).toBeGreaterThan(70);
      expect(result.levelId).toBeGreaterThanOrEqual(7);
    });
  });

  describe('inputQuality', () => {
    it('should give 0 for empty letters', () => {
      const input: ConfidenceInput = { ...baseInput, letters: [] };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.inputQuality).toBe(0);
    });

    it('should warn for very short name', () => {
      const input: ConfidenceInput = { ...baseInput, name: 'ي', letters: ['ي'] };
      const result = confidenceEngine.calculate(input);
      expect(result.warnings.some(w => w.includes('قصير'))).toBe(true);
    });

    it('should give high score for 3-10 letters', () => {
      const input: ConfidenceInput = { ...baseInput, name: 'فاطمة', letters: ['ف', 'ا', 'ط', 'م', 'ه'] };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.inputQuality).toBeGreaterThan(80);
    });
  });

  describe('dataCompleteness', () => {
    it('should detect missing planet', () => {
      const input: ConfidenceInput = { ...baseInput, planet: '' };
      const result = confidenceEngine.calculate(input);
      expect(result.warnings.some(w => w.includes('الكوكب'))).toBe(true);
    });

    it('should detect missing sign', () => {
      const input: ConfidenceInput = { ...baseInput, sign: '' };
      const result = confidenceEngine.calculate(input);
      expect(result.warnings.some(w => w.includes('البرج'))).toBe(true);
    });

    it('should give 100 for complete data', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.breakdown.dataCompleteness).toBeGreaterThanOrEqual(90);
    });
  });

  describe('layerConsistency', () => {
    it('should penalize planet-element mismatch', () => {
      const input: ConfidenceInput = {
        ...baseInput,
        planet: 'الشمس', // ناري
        element: 'ماء',  // مائي
      };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.layerConsistency).toBeLessThan(90);
      expect(result.warnings.some(w => w.includes('تعارض'))).toBe(true);
    });

    it('should penalize invalid root', () => {
      const input: ConfidenceInput = { ...baseInput, root: 15 };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.layerConsistency).toBeLessThan(80);
    });

    it('should penalize invalid house', () => {
      const input: ConfidenceInput = { ...baseInput, house: 20 };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.layerConsistency).toBeLessThan(90);
    });

    it('should penalize unknown element', () => {
      const input: ConfidenceInput = { ...baseInput, element: 'نور' };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.layerConsistency).toBeLessThan(80);
    });

    it('should give 100 for perfectly consistent input', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.breakdown.layerConsistency).toBe(100);
    });
  });

  describe('resonanceStrength', () => {
    it('should give neutral score for no resonance', () => {
      const input: ConfidenceInput = { ...baseInput, resonance: undefined };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.resonanceStrength).toBe(70);
    });

    it('should give high score for complete resonance', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.breakdown.resonanceStrength).toBeGreaterThan(80);
    });
  });

  describe('wafqClarity', () => {
    it('should give neutral score for no wafq', () => {
      const input: ConfidenceInput = { ...baseInput, wafq: undefined };
      const result = confidenceEngine.calculate(input);
      expect(result.breakdown.wafqClarity).toBe(60);
    });

    it('should detect 3x3 wafq', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.breakdown.wafqClarity).toBeGreaterThanOrEqual(80);
    });
  });

  describe('level classification', () => {
    it('should classify perfect input as يقين مطلق or شبه يقينية', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(result.levelId).toBeGreaterThanOrEqual(8);
    });

    it('should classify poor input as ضعيفة', () => {
      const input: ConfidenceInput = {
        name: 'ي',
        letters: ['ي'],
        root: 15,
        planet: '',
        sign: '',
        element: 'نور',
        house: 20,
      };
      const result = confidenceEngine.calculate(input);
      expect(result.levelId).toBeLessThan(4);
    });
  });

  describe('shouldAbstain', () => {
    it('should recommend abstention for low confidence', () => {
      const input: ConfidenceInput = {
        name: 'ي',
        letters: ['ي'],
        root: 15,
        planet: '',
        sign: '',
        element: 'نور',
        house: 20,
      };
      const result = confidenceEngine.calculate(input);
      expect(confidenceEngine.shouldAbstain(result)).toBe(true);
    });

    it('should NOT recommend abstention for high confidence', () => {
      const result = confidenceEngine.calculate(baseInput);
      expect(confidenceEngine.shouldAbstain(result)).toBe(false);
    });
  });

  describe('getLevelEmoji', () => {
    it('should return green for high level', () => {
      expect(confidenceEngine.getLevelEmoji(10)).toBe('🟢');
    });

    it('should return yellow for medium level', () => {
      expect(confidenceEngine.getLevelEmoji(6)).toBe('🟡');
    });

    it('should return red for low level', () => {
      expect(confidenceEngine.getLevelEmoji(2)).toBe('🔴');
    });
  });
});
