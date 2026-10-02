import { describe, it, expect } from 'vitest';
import { EthicalGuardrails } from '../../src/ai/EthicalGuardrails';

describe('EthicalGuardrails', () => {
  const g = new EthicalGuardrails();

  it('سؤال عادي → مسموح', () => {
    expect(g.checkInput('حلل شخصية محمد').allowed).toBe(true);
  });

  it('سؤال عن الموت → مرفوض', () => {
    const r = g.checkInput('هل سأموت قريباً؟');
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('الموت');
  });

  it('سؤال طبي → مرفوض', () => {
    const r = g.checkInput('ما علاجي؟ هل سأشفى؟');
    expect(r.allowed).toBe(false);
  });

  it('سؤال فتوى → مرفوض', () => {
    const r = g.checkInput('هل هذا حلال أم حرام؟');
    expect(r.allowed).toBe(false);
  });

  it('ادعاء قدري → مرفوض', () => {
    const r = g.checkInput('هل مقدر لي أن أفشل؟');
    expect(r.allowed).toBe(false);
  });

  it('إخراج فيه تنبؤ قاطع → يُخفّف', () => {
    const r = g.checkOutput('سوف يحدث لا محالة أن تنجح');
    expect(r.sanitized).not.toContain('سوف يحدث لا محالة');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('إخراج فيه ادعاء طبي → يُحيّد', () => {
    const r = g.checkOutput('هذا الدواء يعالج المرض نهائياً');
    expect(r.sanitized).not.toContain('يعالج المرض');
  });

  it('إخراج نظيف → لا تغيير', () => {
    const r = g.checkOutput('هذا تحليل نمطي لا حتمي.');
    expect(r.sanitized).toBe('هذا تحليل نمطي لا حتمي.');
    expect(r.warnings).toEqual([]);
  });
});
