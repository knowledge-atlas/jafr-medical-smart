import { describe, it, expect } from 'vitest';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const fakeAnalysis: AnalysisResult = {
  status: 'full',
  name: 'محمد',
  confidence: {
    overall: 0.85,
    level: 'عالية',
    dimensions: {
      inputQuality: 1, dataCompleteness: 1, layerConsistency: 1,
      resonanceStrength: 1, wafqClarity: 1, verificationHistory: 1,
    },
    shouldAbstain: false,
    reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_3', planet: 'planet_7', sign: 'sign_5', house: 'house_4', element: 'ناري' },
  report: '',
};

describe('DeepDiveReport', () => {
  const engine = new DeepDiveReport();

  it('يولّد 19 قسماً', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.sectionCount).toBe(19);
    expect(out.sections.length).toBe(19);
  });

  it('يحتوي على الاسم في markdown', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('محمد');
  });

  it('يحوي بيانات وصفية صحيحة', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.meta.productId).toBe('deep-dive-report');
    expect(out.meta.offline).toBe(true);
  });

  it('يحوي درجة الثقة', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('85%');
    expect(out.markdown).toContain('عالية');
  });

  it('يظهر الطبع الناري في القسم المخصص', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('ناري');
  });

  it('وضع "marital" يعرض توصيات مختلفة', () => {
    const out = engine.generate(fakeAnalysis, 'marital');
    expect(out.markdown).toContain('الطرفان');
  });

  it('وضع "commercial" يعرض اختبار A/B', () => {
    const out = engine.generate(fakeAnalysis, 'commercial');
    expect(out.markdown).toContain('A/B');
  });

  it('يحوي إخلاء مسؤولية', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('إخلاء');
    expect(out.markdown).toContain('لا يُعدّ');
  });

  it('يستخرج عدد الكلمات', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.wordCount).toBeGreaterThan(50);
  });

  it('يعمل مع طبع ترابي', () => {
    const e: AnalysisResult = { ...fakeAnalysis, layers: { ...fakeAnalysis.layers, element: 'ترابي' } };
    const out = engine.generate(e);
    expect(out.markdown).toContain('ترابي');
  });

  it('يعمل بدون layers', () => {
    const e: AnalysisResult = { ...fakeAnalysis, layers: undefined };
    const out = engine.generate(e);
    expect(out.sectionCount).toBe(19);
  });
});
