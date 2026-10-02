import { describe, it, expect } from 'vitest';
import { LLMBridgeAdapter } from '../../src/ai/LLMBridgeAdapter';

describe('LLMBridgeAdapter', () => {
  it('يحوّل استجابة الجسر إلى LLMCallResult', async () => {
    const bridge = {
      generate: async () => ({ answer: 'رد من الجسر', tokensUsed: 42 }),
    };
    const adapter = new LLMBridgeAdapter(bridge);
    const r = await adapter.generate('sys', 'user');
    expect(r.answer).toBe('رد من الجسر');
    expect(r.tokensUsed).toBe(42);
  });

  it('عند رجوع null → رسالة احتياطية', async () => {
    const bridge = { generate: async () => null };
    const adapter = new LLMBridgeAdapter(bridge);
    const r = await adapter.generate('sys', 'user');
    expect(r.answer).toContain('تعذّر');
    expect(r.tokensUsed).toBe(0);
  });

  it('عند رجوع answer فارغ → رسالة احتياطية', async () => {
    const bridge = { generate: async () => ({ answer: '' }) };
    const adapter = new LLMBridgeAdapter(bridge);
    const r = await adapter.generate('sys', 'user');
    expect(r.answer).toContain('تعذّر');
  });

  it('intent الافتراضي analytical', async () => {
    let captured = '';
    const bridge = {
      generate: async (_c: any, _t: string, intent: string) => {
        captured = intent;
        return { answer: 'ok' };
      },
    };
    const adapter = new LLMBridgeAdapter(bridge);
    await adapter.generate('s', 'u');
    expect(captured).toBe('analytical');
  });

  it('intent مخصص يُمرَّر بشكل صحيح', async () => {
    let captured = '';
    const bridge = {
      generate: async (_c: any, _t: string, intent: string) => {
        captured = intent;
        return { answer: 'ok' };
      },
    };
    const adapter = new LLMBridgeAdapter(bridge, 'medical');
    await adapter.generate('s', 'u');
    expect(captured).toBe('medical');
  });
});
