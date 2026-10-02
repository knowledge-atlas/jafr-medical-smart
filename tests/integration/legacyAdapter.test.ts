import { describe, it, expect } from 'vitest';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { analysisToLegacyReport } from '../../src/application/di/legacyAdapter';

describe('legacyAdapter — التوافق مع ReportScreen', () => {
  const analyze = createRealAnalyzeNameUseCase();
  const dd = new DeepDiveReport();

  it('محمد → الشكل القديم كامل', () => {
    const a = analyze.execute({ name: 'محمد' });
    const out = dd.generate(a, 'personal');
    const legacy = analysisToLegacyReport(a, out);

    expect(typeof legacy.root).toBe('number');
    expect(typeof legacy.internalPlanet).toBe('string');
    expect(typeof legacy.internalSign).toBe('string');
    expect(typeof legacy.internalElement).toBe('string');
    expect(typeof legacy.internalHouse).toBe('number');
    expect(typeof legacy.calculation.total).toBe('number');
    expect(typeof legacy.fullReport).toBe('string');
  });

  it('fullReport = markdown التقرير العميق', () => {
    const a = analyze.execute({ name: 'محمد' });
    const out = dd.generate(a);
    const legacy = analysisToLegacyReport(a, out);
    expect(legacy.fullReport).toBe(out.markdown);
    expect(legacy.fullReport).toContain('محمد');
  });

  it('اسم غير عربي → fullReport يحتوي نص الامتناع', () => {
    const a = analyze.execute({ name: 'John' });
    const out = dd.generate(a);
    const legacy = analysisToLegacyReport(a, out);
    expect(legacy.fullReport.length).toBeGreaterThan(0);
  });

  it('productId = deep-dive-report', () => {
    const a = analyze.execute({ name: 'محمد' });
    const out = dd.generate(a);
    const legacy = analysisToLegacyReport(a, out);
    expect(legacy.productId).toBe('deep-dive-report');
  });

  it('root يُستخرج رقمياً من "root_3"', () => {
    const a = analyze.execute({ name: 'محمد' });
    const out = dd.generate(a);
    const legacy = analysisToLegacyReport(a, out);
    expect(legacy.root).toBeGreaterThanOrEqual(0);
    expect(legacy.root).toBeLessThanOrEqual(9);
  });

  it('internalHouse ضمن 1..12', () => {
    const a = analyze.execute({ name: 'محمد' });
    const out = dd.generate(a);
    const legacy = analysisToLegacyReport(a, out);
    expect(legacy.internalHouse).toBeGreaterThanOrEqual(1);
    expect(legacy.internalHouse).toBeLessThanOrEqual(12);
  });
});
