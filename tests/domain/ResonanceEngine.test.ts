import { describe, it, expect } from 'vitest';
import { ResonanceEngine, resonanceEngine } from '../../src/domain/services/ResonanceEngine';

describe('ResonanceEngine', () => {
  const engine = new ResonanceEngine();

  it('يُحمّل بيانات الرنين من JSON', () => {
    expect(engine.size()).toBeGreaterThanOrEqual(45);
  });

  it('يُرجع رنين "2+4" بشكل صحيح', () => {
    const r = engine.get(2, 4);
    expect(r).not.toBeNull();
    expect(r?.entry.description).toContain('ميزان');
  });

  it('يُوَحّد المفاتيح (4+2 = 2+4)', () => {
    const r1 = engine.get(4, 2);
    const r2 = engine.get(2, 4);
    expect(r1?.key).toBe('2+4');
    expect(r2?.key).toBe('2+4');
  });

  it('يُكتشف الرنين الذاتي (2+2)', () => {
    const r = engine.get(2, 2);
    expect(r?.isSelfResonance).toBe(true);
    expect(r?.entry.shadow).toContain('تعلق');
  });

  it('رنين الجذر 1+1 = تضاعف إرادة', () => {
    const r = engine.get(1, 1);
    expect(r?.entry.description).toContain('تضاعف');
    expect(r?.strength).toBeGreaterThan(0.9);
  });

  it('getTopForRoot يُرجع 3 علاقات مرتّبة', () => {
    const top = engine.getTopForRoot(2, 3);
    expect(top.length).toBe(3);
    expect(top[0].strength).toBeGreaterThanOrEqual(top[1].strength);
    expect(top[1].strength).toBeGreaterThanOrEqual(top[2].strength);
  });

  it('getWeakestForRoot يُرجع أضعف العلاقات', () => {
    const weakest = engine.getWeakestForRoot(1, 2);
    expect(weakest.length).toBe(2);
    expect(weakest[0].strength).toBeLessThanOrEqual(weakest[1].strength);
  });

  it('getForRoot(2) يُرجع 9 علاقات', () => {
    const all = engine.getForRoot(2);
    expect(all.length).toBe(9);
  });

  it('get(10, 1) يُرجع null (خارج النطاق)', () => {
    expect(engine.get(10, 1)).toBeNull();
  });

  it('get(0, 5) يُرجع null', () => {
    expect(engine.get(0, 5)).toBeNull();
  });

  it('verdict صحيح لرنين تضاعف (بناء)', () => {
    const r = engine.get(2, 2);
    expect(['بناء', 'توازن', 'تحذير', 'صدام']).toContain(r?.verdict);
  });

  it('getAll يُرجع 45 علاقة', () => {
    expect(engine.getAll().length).toBe(45);
  });

  it('resonanceEngine singleton موجود', () => {
    expect(resonanceEngine.size()).toBeGreaterThan(0);
  });
});
