import { describe, it, expect } from 'vitest';
import { NarrativeWeaver } from '../../src/ai/NarrativeWeaver';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const fakeFull: AnalysisResult = {
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
  layers: { root: 'root_3', planet: 'planet_7', sign: 'sign_5', element: 'ناري' },
  report: '',
};

describe('NarrativeWeaver', () => {
  const w = new NarrativeWeaver();

  it('شخصي — يذكر الاسم والجذر', () => {
    const text = w.weave(fakeFull, 'personal');
    expect(text).toContain('محمد');
    expect(text).toContain('الجذر 3');
    expect(text).toContain('85%');
  });

  it('زواجي — يذكر سياق التوافق', () => {
    expect(w.weave(fakeFull, 'marital')).toContain('التوافق');
  });

  it('مهني — يذكر السياق المهني', () => {
    expect(w.weave(fakeFull, 'professional')).toContain('المهني');
  });

  it('تجاري — يذكر السياق التجاري', () => {
    expect(w.weave(fakeFull, 'commercial')).toContain('التجاري');
  });

  it('طبع ناري → استعارة الشعلة', () => {
    expect(w.weave(fakeFull, 'personal')).toContain('شعلة');
  });

  it('abstained → يعيد التقرير كما هو', () => {
    const abstained: AnalysisResult = {
      ...fakeFull,
      status: 'abstained',
      report: 'تقرير امتناع جاهز',
      layers: undefined,
    };
    expect(w.weave(abstained, 'personal')).toBe('تقرير امتناع جاهز');
  });
});
