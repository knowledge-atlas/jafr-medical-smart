import { describe, it, expect } from 'vitest';
import { TemporalAnalyzer, temporalAnalyzer } from '../../src/domain/services/TemporalAnalyzer';

describe('TemporalAnalyzer', () => {
  const engine = new TemporalAnalyzer();
  const start = new Date('2026-10-03');

  it('analyzeDay يُرجع بنية كاملة', () => {
    const d = engine.analyzeDay(start, 2, 0);
    expect(d.date).toBe('2026-10-03');
    expect(d.dayIndex).toBe(0);
    expect(typeof d.score).toBe('number');
    expect(['ذروة', 'جيد', 'محايد', 'منخفض', 'تعبئة']).toContain(d.quality);
  });

  it('mod9 = rootNum في اليوم 0', () => {
    const d = engine.analyzeDay(start, 2, 0);
    expect(d.mod9).toBe(2);
  });

  it('mod9 يدور بعد 9 أيام', () => {
    const d = engine.analyzeDay(start, 2, 9);
    expect(d.mod9).toBe(2);
  });

  it('mod7 يعمل بشكل صحيح', () => {
    const d = engine.analyzeDay(start, 2, 5);
    expect(d.mod7).toBe(7); // (2+5)%7 = 0 → 7
  });

  it('mod12 يعمل بشكل صحيح', () => {
    const d = engine.analyzeDay(start, 2, 10);
    expect(d.mod12).toBe(12); // (2+10)%12 = 0 → 12
  });

  it('mod28 يعمل بشكل صحيح', () => {
    const d = engine.analyzeDay(start, 2, 26);
    expect(d.mod28).toBe(28); // (2+26)%28 = 0 → 28
  });

  it('score بين 0 و 1', () => {
    const d = engine.analyzeDay(start, 2, 0);
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(1);
  });

  it('يوم الجذر نفسه = ذروة', () => {
    const d = engine.analyzeDay(start, 5, 0);
    expect(d.score).toBeGreaterThanOrEqual(0.75);
  });

  it('rootText من REMAINDERS_FULL_TEXT', () => {
    const d = engine.analyzeDay(start, 2, 0);
    expect(d.rootText).toContain('الباقي 2');
  });

  it('advice يحوي الترياق', () => {
    const d = engine.analyzeDay(start, 2, 0);
    expect(d.advice).toContain('الترياق');
  });

  it('analyzeRange يُرجع 28 يوماً افتراضياً', () => {
    const r = engine.analyzeRange(start, 2);
    expect(r.calendar.length).toBe(28);
  });

  it('analyzeRange مع 14 يوماً', () => {
    const r = engine.analyzeRange(start, 2, 14);
    expect(r.calendar.length).toBe(14);
  });

  it('peakDays بحد أقصى 7', () => {
    const r = engine.analyzeRange(start, 2);
    expect(r.peakDays.length).toBeLessThanOrEqual(7);
  });

  it('criticalDays بحد أقصى 5', () => {
    const r = engine.analyzeRange(start, 2);
    expect(r.criticalDays.length).toBeLessThanOrEqual(5);
  });

  it('summary يحوي متوسط الطاقة', () => {
    const r = engine.analyzeRange(start, 2);
    expect(r.summary).toContain('متوسط طاقة الفترة');
  });

  it('topDays يُرجع 3 أيام مرتّبة', () => {
    const r = engine.analyzeRange(start, 2);
    const top = engine.topDays(r, 3);
    expect(top.length).toBe(3);
    expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
  });

  it('bottomDays يُرجع أضعف الأيام', () => {
    const r = engine.analyzeRange(start, 2);
    const bottom = engine.bottomDays(r, 3);
    expect(bottom[0].score).toBeLessThanOrEqual(bottom[2].score);
  });

  it('calendar يحوي كل الحقول المطلوبة', () => {
    const r = engine.analyzeRange(start, 2, 7);
    r.calendar.forEach((d) => {
      expect(d.mod9).toBeGreaterThanOrEqual(1);
      expect(d.mod9).toBeLessThanOrEqual(9);
      expect(d.mod7).toBeGreaterThanOrEqual(1);
      expect(d.mod7).toBeLessThanOrEqual(7);
      expect(d.mod12).toBeGreaterThanOrEqual(1);
      expect(d.mod12).toBeLessThanOrEqual(12);
      expect(d.mod28).toBeGreaterThanOrEqual(1);
      expect(d.mod28).toBeLessThanOrEqual(28);
    });
  });

  it('singleton موجود', () => {
    expect(temporalAnalyzer.analyzeDay(start, 1, 0)).toBeDefined();
  });
});
