import { describe, it, expect } from 'vitest';
import { HybridEngine } from '../../src/ai/HybridEngine';
import { DemoLLMCaller } from '../../src/ai/LLMCaller';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';

const analyzer = createRealAnalyzeNameUseCase();

describe('HybridEngine — Layer A (Offline)', () => {
  const engine = new HybridEngine({ analyzer });

  it('سؤال مع اسم صحيح → Layer A، offline', async () => {
    const r = await engine.process({
      question: 'حلل شخصية محمد',
      nameForAnalysis: 'محمد',
      mode: 'personal',
    });
    expect(r.offline).toBe(true);
    expect(r.layer).toBe('A');
    expect(r.answer).toContain('محمد');
  });

  it('اسم غير عربي → امتناع، لا Layer B', async () => {
    const r = await engine.process({
      question: 'حلل John',
      nameForAnalysis: 'John',
    });
    expect(r.layer).toBe('A');
    expect(r.answer).toContain('امتناع');
  });

  it('سؤال عن الموت → يرفض قبل التحليل', async () => {
    const r = await engine.process({
      question: 'هل سأموت قريباً؟',
      nameForAnalysis: 'محمد',
    });
    expect(r.answer).toContain('لا يمكنني');
    expect(r.layer).toBe('A');
  });

  it('بدون اسم → رسالة توضيحية', async () => {
    const r = await engine.process({ question: 'ما هو الجفر؟' });
    expect(r.answer).toContain('الرجاء تحديد اسم');
  });
});

describe('HybridEngine — Layer B (with LLM)', () => {
  const engine = new HybridEngine({
    analyzer,
    llmCaller: new DemoLLMCaller(),
  });

  it('عند وجود LLM → Layer B', async () => {
    const r = await engine.process({
      question: 'حلل شخصية محمد',
      nameForAnalysis: 'محمد',
      mode: 'personal',
    });
    expect(r.layer).toBe('B');
    expect(r.offline).toBe(false);
  });

  it('LLM فاشل → يسقط إلى Layer A', async () => {
    const failing = new HybridEngine({
      analyzer,
      llmCaller: {
        generate: async () => { throw new Error('network'); },
      },
    });
    const r = await failing.process({
      question: 'حلل شخصية محمد',
      nameForAnalysis: 'محمد',
    });
    expect(r.layer).toBe('A');
  });
});
