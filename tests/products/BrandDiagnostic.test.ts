import { describe, it, expect } from 'vitest';
import { BrandDiagnostic } from '../../src/products/BrandDiagnostic';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const make = (name: string, element = 'ناري'): AnalysisResult => ({
  status: 'full',
  name,
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
  layers: { root: 'root_3', planet: 'planet_7', sign: 'sign_5', element },
  report: '',
});

describe('BrandDiagnostic', () => {
  const engine = new BrandDiagnostic();

  it('يولّد 6 أبعاد', () => {
    const out = engine.analyze(make('نوفا'));
    expect(out.dimensions.length).toBe(6);
  });

  it('النتيجة الإجمالية بين 0 و 1', () => {
    const out = engine.analyze(make('نوفا'));
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(1);
  });

  it('يولّد 3 بدائل', () => {
    const out = engine.analyze(make('نوفا'));
    expect(out.alternatives.length).toBe(3);
  });

  it('بديل يحوي الاسم الأصلي', () => {
    const out = engine.analyze(make('نوفا'));
    const combined = out.alternatives.map((a) => a.name).join(' ');
    expect(combined).toContain('نوفا');
  });

  it('اسم قصير (3 حروف) → قابلية حفظ عالية', () => {
    const out = engine.analyze(make('أمل'));
    const mem = out.dimensions.find((d) => d.id === 'memorability');
    expect(mem?.score).toBeGreaterThanOrEqual(0.85);
  });

  it('اسم طويل (10 حروف) → قابلية حفظ أقل', () => {
    const out = engine.analyze(make('عبدالرحمن'));
    const mem = out.dimensions.find((d) => d.id === 'memorability');
    expect(mem?.score).toBeLessThan(0.8);
  });

  it('طبع ناري → طاقة عالية', () => {
    const out = engine.analyze(make('نوفا', 'ناري'));
    const e = out.dimensions.find((d) => d.id === 'energy');
    expect(e?.score).toBeGreaterThanOrEqual(0.85);
  });

  it('نشاط تقني + طبع ناري → ملاءمة عالية', () => {
    const out = engine.analyze(make('نوفا', 'ناري'), 'شركة تقنية');
    const fit = out.dimensions.find((d) => d.id === 'fit');
    expect(fit?.score).toBeGreaterThanOrEqual(0.85);
  });

  it('نشاط مطعم + طبع ترابي → ملاءمة عالية', () => {
    const out = engine.analyze(make('أصالة', 'ترابي'), 'مطعم تراثي');
    const fit = out.dimensions.find((d) => d.id === 'fit');
    expect(fit?.score).toBeGreaterThanOrEqual(0.85);
  });

  it('markdown يحوي الاسم والبدائل', () => {
    const out = engine.analyze(make('نوفا'));
    expect(out.markdown).toContain('نوفا');
    expect(out.markdown).toContain('بدائل');
  });

  it('abstained → markdown خاص', () => {
    const a = { ...make('John'), status: 'abstained' as const };
    const out = engine.analyze(a);
    expect(out.markdown).toContain('تعذّر');
    expect(out.dimensions).toEqual([]);
  });

  it('meta صحيح', () => {
    const out = engine.analyze(make('نوفا'));
    expect(out.meta.productId).toBe('brand-diagnostic');
    expect(out.meta.offline).toBe(true);
  });

  it('كل بديل له rationale و projectedScore', () => {
    const out = engine.analyze(make('نوفا'));
    out.alternatives.forEach((a) => {
      expect(a.rationale.length).toBeGreaterThan(5);
      expect(a.projectedScore).toBeGreaterThanOrEqual(0);
      expect(a.projectedScore).toBeLessThanOrEqual(1);
    });
  });
});
