import { describe, it, expect } from 'vitest';
import { CompatibilityEngine } from '../../src/products/CompatibilityEngine';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const make = (
  name: string,
  layers: Partial<AnalysisResult['layers']> = {},
  overall = 0.85
): AnalysisResult => ({
  status: 'full',
  name,
  confidence: {
    overall,
    level: 'عالية',
    dimensions: {
      inputQuality: 1, dataCompleteness: 1, layerConsistency: 1,
      resonanceStrength: 1, wafqClarity: 1, verificationHistory: 1,
    },
    shouldAbstain: false,
    reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_3', planet: 'planet_7', sign: 'sign_5', element: 'ناري', ...layers },
  report: '',
});

describe('CompatibilityEngine', () => {
  const engine = new CompatibilityEngine();

  it('يولّد 7 أبعاد', () => {
    const out = engine.compare(make('محمد'), make('فاطمة'));
    expect(out.dimensions.length).toBe(7);
  });

  it('النتيجة الإجمالية بين 0 و 1', () => {
    const out = engine.compare(make('محمد'), make('فاطمة'));
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(1);
  });

  it('طبعان متكاملان (ناري + هوائي) → مرتفع', () => {
    const a = make('محمد', { element: 'ناري' });
    const b = make('فاطمة', { element: 'هوائي' });
    const out = engine.compare(a, b);
    const el = out.dimensions.find((d) => d.id === 'element');
    expect(el?.score).toBeGreaterThanOrEqual(0.85);
  });

  it('طبعان متضادان (ناري + مائي) → منخفض', () => {
    const a = make('محمد', { element: 'ناري' });
    const b = make('فاطمة', { element: 'مائي' });
    const out = engine.compare(a, b);
    const el = out.dimensions.find((d) => d.id === 'element');
    expect(el?.score).toBeLessThanOrEqual(0.4);
  });

  it('نفس الجذر → أعلى درجة', () => {
    const a = make('محمد', { root: 'root_3' });
    const b = make('فاطمة', { root: 'root_3' });
    const out = engine.compare(a, b);
    const rd = out.dimensions.find((d) => d.id === 'root');
    expect(rd?.score).toBe(1);
  });

  it('جذور مختلفة جداً → درجة منخفضة', () => {
    const a = make('محمد', { root: 'root_1' });
    const b = make('فاطمة', { root: 'root_9' });
    const out = engine.compare(a, b);
    const rd = out.dimensions.find((d) => d.id === 'root');
    expect(rd?.score).toBeLessThan(0.2);
  });

  it('أبراج متقاربة → درجة مرتفعة', () => {
    const a = make('محمد', { sign: 'sign_5' });
    const b = make('فاطمة', { sign: 'sign_6' });
    const out = engine.compare(a, b);
    const sd = out.dimensions.find((d) => d.id === 'sign');
    expect(sd?.score).toBeGreaterThan(0.8);
  });

  it('markdown يحوي كلا الاسمين', () => {
    const out = engine.compare(make('محمد'), make('فاطمة'));
    expect(out.markdown).toContain('محمد');
    expect(out.markdown).toContain('فاطمة');
  });

  it('abstained → markdown خاص', () => {
    const a = { ...make('محمد'), status: 'abstained' as const };
    const out = engine.compare(a, make('فاطمة'));
    expect(out.markdown).toContain('امتنع');
    expect(out.dimensions).toEqual([]);
  });

  it('meta صحيح', () => {
    const out = engine.compare(make('محمد'), make('فاطمة'));
    expect(out.meta.productId).toBe('compatibility-engine');
    expect(out.meta.offline).toBe(true);
  });

  it('توازن الثقة يعكس فرق الثقة', () => {
    const a = make('محمد', {}, 0.9);
    const b = make('فاطمة', {}, 0.9);
    const out = engine.compare(a, b);
    const cd = out.dimensions.find((d) => d.id === 'confidence');
    expect(cd?.score).toBe(1);
  });
});
