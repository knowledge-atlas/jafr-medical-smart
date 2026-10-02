import { describe, it, expect } from 'vitest';
import {
  AnalyzeNameUseCase,
  AnalysisDependencies,
} from '../../src/application/use-cases/AnalyzeNameUseCase';

const baseDeps: AnalysisDependencies = {
  normalizeName: (n) => n.trim().replace(/[أإآ]/g, 'ا'),
  calculateAbjad: (n) => n.length * 10,
  extractLayers: () => ({
    root: 'root_1',
    planet: 'planet_1',
    sign: 'sign_1',
    element: 'ناري',
  }),
  computeConfidence: () => ({
    inputQuality: 1,
    dataCompleteness: 1,
    layerConsistency: 1,
    resonanceStrength: 1,
    wafqClarity: 1,
    verificationHistory: 1,
  }),
  buildFullReport: (n) => `تقرير كامل: ${n}`,
  buildAbstentionReport: (a) => `امتناع: ${a.messages.join('; ')}`,
};

describe('AnalyzeNameUseCase — Pipeline', () => {
  const useCase = new AnalyzeNameUseCase(baseDeps);

  const arabicNames = [
    'محمد',
    'فاطمة',
    'عبد الرحمن',
    'نور',
    'خالد',
    'يوسف',
    'مريم',
    'أحمد',
    'سارة',
    'ليلى',
  ];

  arabicNames.forEach((name, i) => {
    it(`اسم ${i + 1}: ${name} → تقرير كامل`, () => {
      const r = useCase.execute({ name });
      expect(r.status).toBe('full');
      expect(r.report).toContain(name);
    });
  });

  const nonArabic = ['John', 'Mary', 'George', 'Michael', 'Elizabeth'];
  nonArabic.forEach((name, i) => {
    it(`اسم غير عربي ${i + 11}: ${name} → امتناع`, () => {
      const r = useCase.execute({ name });
      expect(r.status).toBe('abstained');
      expect(r.abstention.reasons).toContain('NON_ARABIC_NAME');
    });
  });

  it('اسم 16: محمد123 → امتناع UNKNOWN_CHARACTERS', () => {
    const r = useCase.execute({ name: 'محمد123' });
    expect(r.status).toBe('abstained');
    expect(r.abstention.reasons).toContain('UNKNOWN_CHARACTERS');
  });

  it('اسم 17: أحمد! → امتناع UNKNOWN_CHARACTERS', () => {
    const r = useCase.execute({ name: 'أحمد!' });
    expect(r.status).toBe('abstained');
    expect(r.abstention.reasons).toContain('UNKNOWN_CHARACTERS');
  });

  it('اسم 18: ثقة منخفضة → امتناع', () => {
    const lowDeps: AnalysisDependencies = {
      ...baseDeps,
      computeConfidence: () => ({
        inputQuality: 0.1,
        dataCompleteness: 0.1,
        layerConsistency: 0.1,
        resonanceStrength: 0.1,
        wafqClarity: 0.1,
        verificationHistory: 0.1,
      }),
    };
    const uc = new AnalyzeNameUseCase(lowDeps);
    const r = uc.execute({ name: 'محمد' });
    expect(r.status).toBe('abstained');
  });

  it('اسم 19: تغذية راجعة سلبية مكررة → امتناع', () => {
    const r = useCase.execute({
      name: 'محمد',
      feedbackHistory: [
        { pattern: 'root_1:planet_1:sign_1', wasAccurate: false },
        { pattern: 'root_1:planet_1:sign_1', wasAccurate: false },
      ],
    });
    expect(r.status).toBe('abstained');
    expect(r.abstention.reasons).toContain('FEEDBACK_CONTRADICTION');
  });

  it('اسم 20: تغذية راجعة إيجابية → تقرير كامل', () => {
    const r = useCase.execute({
      name: 'محمد',
      feedbackHistory: [
        { pattern: 'root_1:planet_1:sign_1', wasAccurate: true },
        { pattern: 'root_1:planet_1:sign_1', wasAccurate: true },
      ],
    });
    expect(r.status).toBe('full');
  });
});
