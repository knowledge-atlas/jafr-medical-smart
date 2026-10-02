import { describe, it, expect } from 'vitest';
import { routeAssistantText } from '../../src/screens/assistantRouter';

describe('routeAssistantText', () => {
  it('"حلل محمد" → hybrid + personal', () => {
    const r = routeAssistantText('حلل محمد');
    expect(r.decision).toBe('hybrid');
    expect(r.name).toBe('محمد');
    expect(r.mode).toBe('personal');
  });

  it('"حلل فاطمة" → hybrid + personal', () => {
    const r = routeAssistantText('حلل فاطمة');
    expect(r.decision).toBe('hybrid');
    expect(r.mode).toBe('personal');
  });

  it('"تحليل علي" → hybrid', () => {
    const r = routeAssistantText('تحليل علي');
    expect(r.decision).toBe('hybrid');
    expect(r.name).toBe('علي');
  });

  it('"توافق محمد وفاطمة" → hybrid + marital', () => {
    const r = routeAssistantText('توافق محمد');
    expect(r.decision).toBe('hybrid');
    expect(r.mode).toBe('marital');
  });

  it('"حلل محمد للعمل" → hybrid + professional', () => {
    const r = routeAssistantText('حلل محمد مسار مهني');
    expect(r.decision).toBe('hybrid');
    expect(r.mode).toBe('professional');
  });

  it('"براند نوفا" → hybrid + commercial', () => {
    const r = routeAssistantText('تحليل براند نوفا');
    expect(r.decision).toBe('hybrid');
    expect(r.mode).toBe('commercial');
  });

  it('"ما هو الجفر؟" → kb', () => {
    const r = routeAssistantText('ما هو الجفر؟');
    expect(r.decision).toBe('kb');
    expect(r.name).toBeUndefined();
  });

  it('"كيف أتعامل مع الجذر 3؟" → kb', () => {
    expect(routeAssistantText('كيف أتعامل مع الجذر 3؟').decision).toBe('kb');
  });

  it('"الجذر 5" → kb (stopword)', () => {
    expect(routeAssistantText('الجذر 5').decision).toBe('kb');
  });
});
