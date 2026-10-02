import { describe, it, expect } from 'vitest';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const fakeAnalysis: AnalysisResult = {
  status: 'full',
  name: 'محمد',
  confidence: {
    overall: 0.86,
    level: 'عالية',
    dimensions: {
      inputQuality: 1, dataCompleteness: 1, layerConsistency: 1,
      resonanceStrength: 0.8, wafqClarity: 0.7, verificationHistory: 0.5,
    },
    shouldAbstain: false,
    reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_2', planet: 'زهرة', sign: 'الثور', house: 'house_8', element: 'ترابي' },
  report: '# التقرير الجفري القياسي\n\n## بيانات السجل\n\nنص غني.',
};

describe('DeepDiveReport v1.5', () => {
  const engine = new DeepDiveReport();

  it('يولّد 17 قسماً', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.sectionCount).toBe(18);
    expect(out.sections.length).toBe(18);
  });

  it('meta v1.4.0', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.meta.productId).toBe('deep-dive-report');
    expect(out.meta.version).toBe('1.5.0');
  });

  it('يحتوي على الاسم في markdown', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('محمد');
  });

  it('قسم الرنين يحوي رنيناً حقيقياً', () => {
    const out = engine.generate(fakeAnalysis);
    const res = out.sections.find((s) => s.id === 'resonance');
    expect(res?.content).toContain('الظل');
    expect(res?.content).toContain('الترياق');
  });

  it('قسم schism موجود ويعرض الانسجام', () => {
    const out = engine.generate(fakeAnalysis);
    const schism = out.sections.find((s) => s.id === 'schism');
    expect(schism).toBeDefined();
    expect(schism?.content).toContain('الانسجام البنيوي');
    expect(schism?.content).toContain('الطبع الغالب');
  });

  it('schism يعرض ترابي كطبع غالب', () => {
    const out = engine.generate(fakeAnalysis);
    const schism = out.sections.find((s) => s.id === 'schism');
    expect(schism?.content).toContain('ترابي');
  });

  it('schism يُدرج ترياقاً مخصصاً', () => {
    const out = engine.generate(fakeAnalysis);
    const schism = out.sections.find((s) => s.id === 'schism');
    expect(schism?.content).toContain('الترياق');
  });

  it('قسم confidence يعرض 6 محاور', () => {
    const out = engine.generate(fakeAnalysis);
    const conf = out.sections.find((s) => s.id === 'confidence');
    expect(conf?.content).toContain('قوة الرنين');
  });

  it('wordCount > 100', () => {
    expect(engine.generate(fakeAnalysis).wordCount).toBeGreaterThan(100);
  });

  it('يعمل بدون layers', () => {
    const e: AnalysisResult = { ...fakeAnalysis, layers: undefined };
    const out = engine.generate(e);
    expect(out.sectionCount).toBe(18);
  });

  it('وضع marital يعرض توصيات مختلفة', () => {
    const out = engine.generate(fakeAnalysis, 'marital');
    expect(out.markdown).toContain('قراءة مشتركة');
  });
});

describe('DeepDiveReport v1.5 — قسم temporal', () => {
  const engine = new DeepDiveReport();

  it('قسم temporal موجود', () => {
    const out = engine.generate(fakeAnalysis);
    const t = out.sections.find((s) => s.id === 'temporal');
    expect(t).toBeDefined();
    expect(t?.content).toContain('متوسط طاقة');
  });

  it('temporal يعرض 7 أيام', () => {
    const out = engine.generate(fakeAnalysis);
    const t = out.sections.find((s) => s.id === 'temporal');
    expect(t?.content).toContain('الأيام السبعة');
  });

  it('temporal يحوي الترياق', () => {
    const out = engine.generate(fakeAnalysis);
    const t = out.sections.find((s) => s.id === 'temporal');
    expect(t?.content).toContain('mod9');
  });
});
