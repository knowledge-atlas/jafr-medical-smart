import { describe, it, expect } from 'vitest';
import { CompatibilityEngine } from '../../src/products/CompatibilityEngine';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const make = (name: string, root = 'root_3'): AnalysisResult => ({
  status: 'full',
  name,
  confidence: {
    overall: 0.85, level: 'عالية',
    dimensions: { inputQuality: 1, dataCompleteness: 1, layerConsistency: 1, resonanceStrength: 1, wafqClarity: 1, verificationHistory: 1 },
    shouldAbstain: false, reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root, planet: 'قمر', sign: 'السرطان', element: 'ترابي' },
  report: '',
});

describe('CompatibilityEngine.analyzeDeep (v2)', () => {
  const engine = new CompatibilityEngine();

  it('يولّد 8 أبعاد', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('فاطمة', 'root_4'));
    expect(out.dimensions.length).toBe(8);
  });

  it('يوجد بعد resonance', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('فاطمة', 'root_4'));
    const res = out.dimensions.find((d) => d.id === 'resonance');
    expect(res).toBeDefined();
    expect(res?.note).toContain('2+4');
  });

  it('يوجد بعد shadow', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('فاطمة', 'root_4'));
    expect(out.dimensions.find((d) => d.id === 'shadow')).toBeDefined();
  });

  it('2+4 → رنين قوي', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('فاطمة', 'root_4'));
    const res = out.dimensions.find((d) => d.id === 'resonance');
    expect(res?.score).toBeGreaterThanOrEqual(0.7);
  });

  it('2+2 → رنين ذاتي قوي', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('علي', 'root_2'));
    const res = out.dimensions.find((d) => d.id === 'resonance');
    expect(res?.score).toBeGreaterThanOrEqual(0.9);
  });

  it('resonanceNote موجود', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('فاطمة', 'root_4'));
    expect(out.resonanceNote).toBeDefined();
  });

  it('markdown يحوي قسم الرنين', () => {
    const out = engine.analyzeDeep(make('محمد', 'root_2'), make('فاطمة', 'root_4'));
    expect(out.markdown).toContain('الرنين من نص البوني');
  });

  it('meta v2.0.0', () => {
    const out = engine.analyzeDeep(make('محمد'), make('فاطمة'));
    expect(out.meta.version).toBe('2.0.0');
  });

  it('compare القديمة لا تزال تعمل (7 أبعاد)', () => {
    const out = engine.compare(make('محمد'), make('فاطمة'));
    expect(out.dimensions.length).toBe(7);
  });
});
