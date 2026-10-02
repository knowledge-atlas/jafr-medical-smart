import { describe, it, expect } from 'vitest';
import { HybridEngine } from '../../src/ai/HybridEngine';
import { LLMBridgeAdapter } from '../../src/ai/LLMBridgeAdapter';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';

const analyzer = createRealAnalyzeNameUseCase();

describe('HybridEngine + LLMBridgeAdapter', () => {
  it('Layer B يعمل عبر الجسر', async () => {
    const fakeBridge = {
      generate: async () => ({ answer: 'رد من الجسر التجريبي', tokensUsed: 7 }),
    };
    const engine = new HybridEngine({
      analyzer,
      llmCaller: new LLMBridgeAdapter(fakeBridge),
    });
    const r = await engine.process({
      question: 'حلل محمد',
      nameForAnalysis: 'محمد',
      mode: 'personal',
    });
    expect(r.layer).toBe('B');
    expect(r.offline).toBe(false);
    expect(r.answer).toContain('رد من الجسر');
  });

  it('جسر يُرجع null → fallback داخل الجسر', async () => {
    const bridge = { generate: async () => null };
    const engine = new HybridEngine({
      analyzer,
      llmCaller: new LLMBridgeAdapter(bridge),
    });
    const r = await engine.process({
      question: 'حلل محمد',
      nameForAnalysis: 'محمد',
    });
    expect(r.layer).toBe('B');
    expect(r.answer).toContain('تعذّر');
  });

  it('جسر يفشل → يسقط إلى Layer A', async () => {
    const failingBridge = {
      generate: async () => { throw new Error('boom'); },
    };
    const engine = new HybridEngine({
      analyzer,
      llmCaller: new LLMBridgeAdapter(failingBridge),
    });
    const r = await engine.process({
      question: 'حلل محمد',
      nameForAnalysis: 'محمد',
    });
    expect(r.layer).toBe('A');
    expect(r.offline).toBe(true);
  });

  it('الجسر يُرجع تنبؤاً قاطعاً → Guardrails يُخفّفه', async () => {
    const bridge = {
      generate: async () => ({
        answer: 'سوف يحدث لا محالة أن تنجح في حياتك',
      }),
    };
    const engine = new HybridEngine({
      analyzer,
      llmCaller: new LLMBridgeAdapter(bridge),
    });
    const r = await engine.process({
      question: 'حلل محمد',
      nameForAnalysis: 'محمد',
    });
    expect(r.layer).toBe('B');
    expect(r.answer).not.toContain('سوف يحدث لا محالة');
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
