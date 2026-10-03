import { describe, it, expect } from 'vitest';
import { PsychologicalAxesEngine, psychologicalAxesEngine } from '../../src/domain/services/PsychologicalAxesEngine';
import { NameAnalysisLayers } from '../../src/application/use-cases/AnalyzeNameUseCase';

const layers: NameAnalysisLayers = {
  root: 'root_2',
  planet: 'قمر',
  sign: 'السرطان',
  house: 'house_8',
  element: 'ترابي',
};

describe('PsychologicalAxesEngine', () => {
  const engine = new PsychologicalAxesEngine();

  it('يولّد 12 محوراً فريد', () => {
    const p = engine.analyze('محمد', layers);
    expect(p.axes.length).toBe(12);
  });

  it('الفهرس متسلسل من 1 إلى 15', () => {
    const p = engine.analyze('محمد', layers);
    p.axes.forEach((a, i) => {
      expect(a.index).toBe(i + 1);
    });
  });

  it('كل محور له id فريد', () => {
    const p = engine.analyze('محمد', layers);
    const ids = p.axes.map((a) => a.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('محور الهوية الجوهرية موجود', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'core_identity');
    expect(axis).toBeDefined();
    expect(axis?.narrative).toContain('الجذر 2');
  });

  it('محور الطاقة المحركة يذكر القمر', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'driver_energy');
    expect(axis?.narrative).toContain('القمر');
  });

  it('محور أسلوب التعبير يذكر السرطان', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'expression_style');
    expect(axis?.narrative).toContain('السرطان');
  });

  it('محور الميدان العملي يذكر البيت 8', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'practical_field');
    expect(axis?.narrative).toContain('التحول');
  });

  it('محور الطبع المادي يذكر ترابي', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'material_nature');
    expect(axis?.narrative).toContain('ترابي');
  });

  it.skip('محور الظل مدمج مع قسم الظل', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'primary_shadow');
    expect(axis?.narrative).toContain('ظلك الأساسي');
  });

  it.skip('محور العلاقات مدمج مع الرنين', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'interpersonal');
    expect(axis?.narrative).toContain('أفضل تناغم');
  });

  it.skip('محور البنية مدمج مع Schism', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'internal_structure');
    expect(axis?.narrative).toContain('الانسجام البنيوي');
  });

  it('محور النقطة العمياء موجود', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'blind_spot');
    expect(axis).toBeDefined();
  });

  it('محور الإيقاع الزمني يستخدم TemporalAnalyzer', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'temporal_rhythm');
    expect(axis?.narrative).toContain('متوسط طاقة شهرك');
  });

  it('محور الطاقة الهرمونية يستخدم MEDICAL_ROOTS', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'hormonal_energy');
    expect(axis).toBeDefined();
  });

  it('محور النقطة الحيوية موجود', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'vital_point');
    expect(axis).toBeDefined();
  });

  it('محور محرك الفشل يذكر التسرع أو الجمود', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'failure_driver');
    expect(axis?.narrative).toMatch(/التسرع|الجمود|التشتت|الغرق/);
  });

  it('محور بوابة الاختراق موجود', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'breach_gate');
    expect(axis).toBeDefined();
  });

  it('محور الترياق الشامل موجود', () => {
    const p = engine.analyze('محمد', layers);
    const axis = p.axes.find((a) => a.id === 'unified_remedy');
    expect(axis?.narrative).toContain('الترياق الشامل');
  });

  it('dominantAxis موجود', () => {
    const p = engine.analyze('محمد', layers);
    expect(p.dominantAxis.length).toBeGreaterThan(0);
  });

  it('weakestAxis موجود', () => {
    const p = engine.analyze('محمد', layers);
    expect(p.weakestAxis.length).toBeGreaterThan(0);
  });

  it('overallBalance بين 0 و 1', () => {
    const p = engine.analyze('محمد', layers);
    expect(p.overallBalance).toBeGreaterThanOrEqual(0);
    expect(p.overallBalance).toBeLessThanOrEqual(1);
  });

  it('summary يحوي الاسم والتوازن', () => {
    const p = engine.analyze('محمد', layers);
    expect(p.summary).toContain('محمد');
    expect(p.summary).toContain('التوازن العام');
  });

  it('renderMarkdown يُنتج نصاً منظماً', () => {
    const p = engine.analyze('محمد', layers);
    const md = engine.renderMarkdown(p);
    expect(md).toContain('### ');
    expect(md).toContain('الهوية الجوهرية');
    expect(md).toContain('الترياق الشامل');
  });

  it('كل المحاور لها level صحيح', () => {
    const p = engine.analyze('محمد', layers);
    p.axes.forEach((a) => {
      expect(['مرتفع', 'متوسط', 'منخفض']).toContain(a.level);
    });
  });

  it('كل المحاور لها score بين 0 و 1', () => {
    const p = engine.analyze('محمد', layers);
    p.axes.forEach((a) => {
      expect(a.score).toBeGreaterThanOrEqual(0);
      expect(a.score).toBeLessThanOrEqual(1);
    });
  });

  it('يعمل بدون layers كاملة', () => {
    const p = engine.analyze('محمد', {});
    expect(p.axes.length).toBe(12);
  });

  it('يعمل مع جذر 1', () => {
    const p = engine.analyze('فاطمة', { root: 'root_1', element: 'ناري' });
    expect(p.axes.length).toBe(12);
    const axis = p.axes.find((a) => a.id === 'core_identity');
    expect(axis?.narrative).toContain('السيادة');
  });

  it('singleton موجود', () => {
    expect(psychologicalAxesEngine.analyze('محمد', layers)).toBeDefined();
  });
});
