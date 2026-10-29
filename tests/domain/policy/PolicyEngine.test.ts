import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/domain/policy/PolicyEngine';
import { IntentClassifier } from '../../../src/ai/IntentClassifier';

describe('PolicyEngine — 6 قرارات', () => {
  it('ALLOW: نص عادي', () => {
    const r = policyEngine.evaluateInput('ما هو الجذر 2؟');
    expect(r.decision).toBe('ALLOW');
  });

  it('BLOCK: جرعة دوائية', () => {
    const r = policyEngine.evaluateInput('خذ 500 mg من الدواء');
    expect(r.decision).toBe('BLOCK');
    expect(r.category).toBe('medical');
  });

  it('BLOCK: توجيه دوائي خارج النطاق', () => {
    const r = policyEngine.evaluateInput('اشرب دواء لعلاج الصداع');
    expect(r.decision).toBe('BLOCK');
    expect(r.category).toBe('medical');
  });
  it('TRANSFORM: اسم دواء', () => {
    const r = policyEngine.evaluateInput('تناول Sertraline يومياً');
    expect(r.decision).toBe('TRANSFORM');
    const out = policyEngine.applyTransform('تناول Sertraline يومياً', r);
    expect(out).toContain('[معلومة عامة');
  });

  it('IntentClassifier: detects medical diagnosis', () => {
    const r = new IntentClassifier().classify('هل عندي مرض خطير؟');
    expect(r.intent).toBe('medical');
    expect(r.medical).toBe(true);
  });
  it('ESCALATE: إشارة انتحار', () => {
    const r = policyEngine.evaluateInput('أريد أن أنهي حياتي');
    expect(r.decision).toBe('ESCALATE');
    expect(r.category).toBe('self_harm');
  });

  it('BLOCK: رقم بطاقة', () => {
    const r = policyEngine.evaluateInput('بطاقتي 4532 1234 5678 9012');
    expect(r.decision).toBe('BLOCK');
    expect(r.category).toBe('privacy');
  });

  it('BLOCK: كلمة مرور', () => {
    const r = policyEngine.evaluateInput('كلمة المرور هي abc123');
    expect(r.decision).toBe('BLOCK');
  });

  it('ABSTAIN: فتوى دينية', () => {
    const r = policyEngine.evaluateInput('هل هذا حرام شرعاً؟');
    expect(r.decision).toBe('ABSTAIN');
    expect(r.category).toBe('religious');
  });

  it('ABSTAIN: توقع قانوني', () => {
    const r = policyEngine.evaluateInput('هل سأربح القضية في المحكمة؟');
    expect(r.decision).toBe('ABSTAIN');
    expect(r.category).toBe('legal');
  });

  it('ABSTAIN: توقع مالي', () => {
    const r = policyEngine.evaluateInput('هل سأربح مالاً من البيتكوين؟');
    expect(r.decision).toBe('ABSTAIN');
    expect(r.category).toBe('financial');
  });

  it('PRIORITY: BLOCK > ESCALATE', () => {
    const r = policyEngine.evaluateInput('كلمة المرور 1234 وأريد أن أنهي حياتي');
    expect(r.decision).toBe('BLOCK');
  });

  it('PRIORITY: ESCALATE > WARN', () => {
    const r = policyEngine.evaluateInput('هل عندي مرض وأريد أن أقتل نفسي؟');
    expect(r.decision).toBe('ESCALATE');
  });

  it('isBlocked: يعمل صحيحاً', () => {
    const r1 = policyEngine.evaluateInput('كلمة المرور');
    const r2 = policyEngine.evaluateInput('مرحباً');
    expect(policyEngine.isBlocked(r1)).toBe(true);
    expect(policyEngine.isBlocked(r2)).toBe(false);
  });

  it('stats: يحتوي 6 فئات', () => {
    const s = policyEngine.stats();
    expect(s.total).toBeGreaterThan(10);
    expect(Object.keys(s.byCategory).length).toBe(6);
  });
});
