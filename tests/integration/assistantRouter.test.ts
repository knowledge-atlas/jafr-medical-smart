import { describe, it, expect } from 'vitest';
import { routeAssistantText } from '../../src/screens/assistantRouter';

describe('routeAssistantText — بدون LLM', () => {
  it('"حلل محمد" → hybrid + personal', () => {
    const r = routeAssistantText('حلل محمد', false);
    expect(r.decision).toBe('hybrid');
    expect(r.name).toBe('محمد');
  });

  it('"ما هو الجفر؟" → kb (بدون LLM)', () => {
    const r = routeAssistantText('ما هو الجفر؟', false);
    expect(r.decision).toBe('kb');
  });

  it('"السلام عليكم" → kb (بدون LLM)', () => {
    const r = routeAssistantText('السلام عليكم', false);
    expect(r.decision).toBe('kb');
  });
});

describe('routeAssistantText — مع LLM', () => {
  it('"حلل محمد" → hybrid + personal', () => {
    const r = routeAssistantText('حلل محمد', true);
    expect(r.decision).toBe('hybrid');
    expect(r.name).toBe('محمد');
  });

  it('"السلام عليكم" → hybrid مع LLM', () => {
    const r = routeAssistantText('السلام عليكم', true);
    expect(r.decision).toBe('hybrid');
    expect(r.name).toBeUndefined();
  });

  it('"ما هو الجفر؟" → hybrid مع LLM', () => {
    const r = routeAssistantText('ما هو الجفر؟', true);
    expect(r.decision).toBe('hybrid');
  });

  it('"حلل محمد مسار مهني" → hybrid + professional', () => {
    const r = routeAssistantText('حلل محمد مسار مهني', true);
    expect(r.decision).toBe('hybrid');
    expect(r.mode).toBe('professional');
  });
});
