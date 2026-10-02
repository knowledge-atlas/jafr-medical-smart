import { describe, it, expect } from 'vitest';
import { TemporalTracker } from '../../src/products/TemporalTracker';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const make = (name: string): AnalysisResult => ({
  status: 'full',
  name,
  confidence: {
    overall: 0.85, level: 'عالية',
    dimensions: { inputQuality: 1, dataCompleteness: 1, layerConsistency: 1, resonanceStrength: 1, wafqClarity: 1, verificationHistory: 1 },
    shouldAbstain: false, reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_3', planet: 'planet_7', sign: 'sign_5', element: 'ناري' },
  report: '',
});

describe('TemporalTracker', () => {
  const engine = new TemporalTracker();

  it('يولّد تقويماً 28 يوماً افتراضياً', () => {
    const out = engine.generate(make('محمد'));
    expect(out.calendar.length).toBe(28);
  });

  it('يولّد 14 يوماً عند الطلب', () => {
    const out = engine.generate(make('محمد'), new Date(), 14);
    expect(out.calendar.length).toBe(14);
  });

  it('كل يوم له mod7 بين 1 و 7', () => {
    const out = engine.generate(make('محمد'));
    out.calendar.forEach((d) => {
      expect(d.mod7).toBeGreaterThanOrEqual(1);
      expect(d.mod7).toBeLessThanOrEqual(7);
    });
  });

  it('كل يوم له mod12 بين 1 و 12', () => {
    const out = engine.generate(make('محمد'));
    out.calendar.forEach((d) => {
      expect(d.mod12).toBeGreaterThanOrEqual(1);
      expect(d.mod12).toBeLessThanOrEqual(12);
    });
  });

  it('كل يوم له mod28 بين 1 و 28', () => {
    const out = engine.generate(make('محمد'));
    out.calendar.forEach((d) => {
      expect(d.mod28).toBeGreaterThanOrEqual(1);
      expect(d.mod28).toBeLessThanOrEqual(28);
    });
  });

  it('كل يوم له score في [0, 1]', () => {
    const out = engine.generate(make('محمد'));
    out.calendar.forEach((d) => {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(1);
    });
  });

  it('peakDays بحد أقصى 7', () => {
    const out = engine.generate(make('محمد'));
    expect(out.peakDays.length).toBeLessThanOrEqual(7);
  });

  it('lowDays بحد أقصى 5', () => {
    const out = engine.generate(make('محمد'));
    expect(out.lowDays.length).toBeLessThanOrEqual(5);
  });

  it('markdown يحوي الاسم والتقويم', () => {
    const out = engine.generate(make('محمد'));
    expect(out.markdown).toContain('محمد');
    expect(out.markdown).toContain('mod7');
  });

  it('abstained → markdown خاص', () => {
    const a = { ...make('John'), status: 'abstained' as const };
    const out = engine.generate(a);
    expect(out.markdown).toContain('تعذّر');
    expect(out.calendar).toEqual([]);
  });

  it('meta صحيح', () => {
    const out = engine.generate(make('محمد'));
    expect(out.meta.productId).toBe('temporal-tracker');
  });

  it('quality ضمن القيم المعروفة', () => {
    const out = engine.generate(make('محمد'));
    const allowed = ['ذروة', 'جيد', 'محايد', 'منخفض', 'تعبئة'];
    out.calendar.forEach((d) => {
      expect(allowed).toContain(d.quality);
    });
  });
});
