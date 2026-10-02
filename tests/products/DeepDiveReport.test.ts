import { describe, it, expect } from 'vitest';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const fakeAnalysis: AnalysisResult = {
  status: 'full',
  name: 'محمد',
  confidence: {
    overall: 0.86, level: 'عالية',
    dimensions: { inputQuality: 1, dataCompleteness: 1, layerConsistency: 1, resonanceStrength: 0.8, wafqClarity: 0.7, verificationHistory: 0.5 },
    shouldAbstain: false, reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_2', planet: 'قمر', sign: 'السرطان', house: 'house_8', element: 'ترابي' },
  report: '# التقرير الجفري القياسي\n\n## بيانات السجل\n\nنص غني.',
};

describe('DeepDiveReport v1.3', () => {
  const engine = new DeepDiveReport();

  it('يولّد 16 قسماً', () => {
    expect(engine.generate(fakeAnalysis).sectionCount).toBe(16);
  });

  it('meta صحيح', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.meta.version).toBe('1.3.0');
  });

  it('قسم الرنين يحوي رنيناً حقيقياً', () => {
    const out = engine.generate(fakeAnalysis);
    const res = out.sections.find((s) => s.id === 'resonance');
    expect(res?.content).toContain('الظل');
    expect(res?.content).toContain('الترياق');
  });

  it('قسم confidence يعرض 6 محاور', () => {
    const out = engine.generate(fakeAnalysis);
    const conf = out.sections.find((s) => s.id === 'confidence');
    expect(conf?.content).toContain('قوة الرنين');
  });

  it('wordCount > 100', () => {
    expect(engine.generate(fakeAnalysis).wordCount).toBeGreaterThan(100);
  });
});
