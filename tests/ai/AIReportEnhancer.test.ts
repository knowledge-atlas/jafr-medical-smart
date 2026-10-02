import { describe, it, expect } from 'vitest';
import { AIReportEnhancer } from '../../src/ai/AIReportEnhancer';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const fakeAnalysis: AnalysisResult = {
  status: 'full',
  name: 'محمد',
  confidence: {
    overall: 0.86, level: 'عالية',
    dimensions: { inputQuality: 1, dataCompleteness: 1, layerConsistency: 1, resonanceStrength: 0.8, wafqClarity: 0.7, verificationHistory: 0.5 },
    shouldAbstain: false, reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_2', planet: 'قمر', sign: 'السرطان', house: 'house_8', element: 'ترابي' },
  report: '# تقرير',
};

const fakeReport = new DeepDiveReport().generate(fakeAnalysis, 'personal');

describe('AIReportEnhancer', () => {
  it('بدون LLM يُرجع تقريراً فارغاً', async () => {
    const enhancer = new AIReportEnhancer();
    const result = await enhancer.enhanceReport(fakeReport, 'personal');
    expect(result.sections.length).toBe(0);
    expect(result.successCount).toBe(0);
  });

  it('مع LLM يُعزّز الأقسام', async () => {
    const enhancer = new AIReportEnhancer({
      llmCaller: {
        generate: async (_s, user) => ({
          answer: `✨ ${user.slice(0, 50)} — نسخة محسّنة`,
          tokensUsed: 100,
        }),
      },
    });
    const result = await enhancer.enhanceReport(fakeReport, 'personal');
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.successCount).toBeGreaterThan(0);
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  it('markdown يُنتج تقريراً منظّماً', async () => {
    const enhancer = new AIReportEnhancer({
      llmCaller: {
        generate: async () => ({ answer: 'محتوى محسّن', tokensUsed: 10 }),
      },
    });
    const result = await enhancer.enhanceReport(fakeReport, 'personal');
    const md = enhancer.renderMarkdown(result);
    expect(md).toContain('التقرير المُعزَّز');
    expect(md).toContain('محمد');
  });

  it('فشل LLM لا يكسر التقرير', async () => {
    const enhancer = new AIReportEnhancer({
      llmCaller: {
        generate: async () => { throw new Error('fail'); },
      },
    });
    const result = await enhancer.enhanceReport(fakeReport, 'personal');
    expect(result.failedCount).toBeGreaterThan(0);
  });
});
