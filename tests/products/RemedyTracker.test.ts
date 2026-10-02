import { describe, it, expect } from 'vitest';
import { RemedyTracker, Remedy, RemedyLogEntry } from '../../src/products/RemedyTracker';

describe('RemedyTracker', () => {
  const engine = new RemedyTracker();

  it('addRemedy يُضيف توصية', () => {
    const list = engine.addRemedy([], 'التأمل', '10 دقائق يومياً', 'daily', 7);
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('التأمل');
  });

  it('addRemedy يُنشئ id فريداً', () => {
    const a = engine.addRemedy([], 'أ', 'وصف');
    const b = engine.addRemedy([], 'ب', 'وصف');
    expect(a[0].id).not.toBe(b[0].id);
  });

  it('log يُضيف سجل', () => {
    const logs = engine.log([], 'remedy_x', true, new Date('2026-10-02'));
    expect(logs.length).toBe(1);
    expect(logs[0].done).toBe(true);
  });

  it('log يُحدّث نفس اليوم بدل التكرار', () => {
    const date = new Date('2026-10-02');
    let logs = engine.log([], 'r1', true, date);
    logs = engine.log(logs, 'r1', false, date);
    expect(logs.length).toBe(1);
    expect(logs[0].done).toBe(false);
  });

  it('adherenceRate مع 7/7 = 1', () => {
    const remedies = engine.addRemedy([], 'مهمة', 'وصف', 'daily', 7);
    const rid = remedies[0].id;
    let logs: RemedyLogEntry[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-10-01');
      d.setDate(d.getDate() + i);
      logs = engine.log(logs, rid, true, d);
    }
    const out = engine.generateReport('محمد', remedies, logs, new Date('2026-10-10'));
    expect(out.progress[0].adherenceRate).toBe(1);
  });

  it('adherenceRate مع 0/7 = 0', () => {
    const remedies = engine.addRemedy([], 'مهمة', 'وصف', 'daily', 7);
    const out = engine.generateReport('محمد', remedies, [], new Date());
    expect(out.progress[0].adherenceRate).toBe(0);
  });

  it('streak يحسب الأيام المتتالية', () => {
    const remedies = engine.addRemedy([], 'مهمة', 'وصف', 'daily', 7);
    const rid = remedies[0].id;
    let logs: RemedyLogEntry[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date('2026-10-01');
      d.setDate(d.getDate() + i);
      logs = engine.log(logs, rid, true, d);
    }
    const out = engine.generateReport('محمد', remedies, logs, new Date('2026-10-05'));
    expect(out.progress[0].streak).toBe(5);
  });

  it('status = ملتزم مع التزام مرتفع حديث', () => {
    const remedies = engine.addRemedy([], 'مهمة', 'وصف', 'daily', 7);
    const rid = remedies[0].id;
    let logs: RemedyLogEntry[] = [];
    const base = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      logs = engine.log(logs, rid, true, d);
    }
    const out = engine.generateReport('محمد', remedies, logs, base);
    expect(out.progress[0].status).toBe('ملتزم');
  });

  it('status = متوقف بدون سجلات', () => {
    const remedies = engine.addRemedy([], 'مهمة', 'وصف', 'daily', 7);
    const out = engine.generateReport('محمد', remedies, [], new Date());
    expect(out.progress[0].status).toBe('متوقف');
  });

  it('overallAdherence يحسب المتوسط', () => {
    let remedies: Remedy[] = [];
    remedies = engine.addRemedy(remedies, 'أ', 'وصف', 'daily', 7);
    remedies = engine.addRemedy(remedies, 'ب', 'وصف', 'daily', 7);
    let logs: RemedyLogEntry[] = [];
    const base = new Date('2026-10-01');
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      logs = engine.log(logs, remedies[0].id, true, d);
    }
    const out = engine.generateReport('محمد', remedies, logs, new Date('2026-10-10'));
    expect(out.overallAdherence).toBeGreaterThan(0);
    expect(out.overallAdherence).toBeLessThanOrEqual(1);
  });

  it('markdown يحوي الاسم', () => {
    const out = engine.generateReport('محمد', [], []);
    expect(out.markdown).toContain('محمد');
  });

  it('markdown بدون توصيات يذكر ذلك', () => {
    const out = engine.generateReport('محمد', [], []);
    expect(out.markdown).toContain('لا توجد');
  });

  it('meta صحيح', () => {
    const out = engine.generateReport('محمد', [], []);
    expect(out.meta.productId).toBe('remedy-tracker');
  });
});
