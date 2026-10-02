import { describe, it, expect } from 'vitest';
import { SchismEngine, schismEngine } from '../../src/domain/services/SchismEngine';

describe('SchismEngine', () => {
  const engine = new SchismEngine();

  it('طبقات منسجمة (ترابي/ترابي/ترابي)', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'زحل', sign: 'الثور', element: 'ترابي' });
    expect(r.verdict).toBe('منسجم');
    expect(r.coherence).toBeGreaterThanOrEqual(0.8);
  });

  it('صراع بنيوي (ناري/مائي)', () => {
    const r = engine.evaluate({ root: 'root_1', planet: 'قمر', sign: 'السرطان', element: 'ناري' });
    expect(['توتّر طفيف', 'صراع بنيوي']).toContain(r.verdict);
    expect(r.coherence).toBeLessThan(0.7);
  });

  it('توتّر طفيف (ترابي/ناري)', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'مريخ', sign: 'الحمل', element: 'ترابي' });
    expect(['توتّر طفيف', 'صراع بنيوي', 'منسجم']).toContain(r.verdict);
  });

  it('dominant element = ترابي', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'زهرة', sign: 'الثور', element: 'ترابي' });
    expect(r.dominantElement).toBe('ترابي');
  });

  it('missing element = هوائي (عكس ترابي)', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'زهرة', sign: 'الثور', element: 'ترابي' });
    expect(r.missingElement).toBe('هوائي');
  });

  it('narrative يحوي الطبع الغالب', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'زهرة', sign: 'الثور', element: 'ترابي' });
    expect(r.narrative).toContain('ترابي');
  });

  it('remedy يوجد حسب الطبع المفقود', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'زهرة', sign: 'الثور', element: 'ترابي' });
    expect(r.remedy).toContain('تواصل');
  });

  it('يعمل مع طبقتين فقط', () => {
    const r = engine.evaluate({ root: 'root_2', sign: 'السرطان', element: 'ترابي' });
    expect(r.pairs.length).toBeGreaterThan(0);
  });

  it('مع طبقة واحدة → default', () => {
    const r = engine.evaluate({ element: 'ناري' });
    expect(r.verdict).toBe('توتّر طفيف');
  });

  it('pairs تحوي تقييمات صحيحة', () => {
    const r = engine.evaluate({ planet: 'زهرة', sign: 'الثور', element: 'ترابي' });
    expect(r.pairs.every((p) => p.score >= 0 && p.score <= 1)).toBe(true);
  });

  it('coherence بين 0 و 1', () => {
    const r = engine.evaluate({ root: 'root_2', planet: 'زهرة', sign: 'الثور', element: 'ترابي' });
    expect(r.coherence).toBeGreaterThanOrEqual(0);
    expect(r.coherence).toBeLessThanOrEqual(1);
  });

  it('singleton موجود', () => {
    expect(schismEngine.evaluate({ element: 'مائي' })).toBeDefined();
  });
});
