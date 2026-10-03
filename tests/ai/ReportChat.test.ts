import { describe, it, expect } from 'vitest';
import { ReportChat } from '../../src/ai/ReportChat';
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

describe('ReportChat — offline mode', () => {
  const makeOffline = () => new ReportChat({ llmCaller: null });
  it('يبدأ بلا تقرير محمّل', () => {
    const chat = makeOffline();
    expect(chat.isLoaded()).toBe(false);
  });

  it('loadReport يحمّل التقرير', () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    expect(chat.isLoaded()).toBe(true);
    expect(chat.getReportName()).toBe('محمد');
  });

  it('ask بدون تقرير يُرجع رسالة تنبيه', async () => {
    const chat = makeOffline();
    const reply = await chat.ask('ما جذري؟');
    expect(reply.role).toBe('assistant');
    expect(reply.content).toContain('لم يتم تحميل');
  });

  it('ask مع تقرير بدون LLM → إجابة محلية', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('ما جذري؟');
    expect(reply.role).toBe('assistant');
    expect(reply.content.length).toBeGreaterThan(0);
  });

  it('ask عن الرنين → إجابة محلية', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('أريد الرنين');
    expect(reply.content).toContain('قسم الرنين');
  });

  it('ask عن الترياق → توصيات', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('ما الترياق؟');
    expect(reply.role).toBe('assistant');
  });

  it('رفض سؤال عن الموت (Guardrails)', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('هل سأموت قريباً؟');
    expect(reply.content).toContain('لا يمكنني');
    expect(reply.warning).toBe('ethical_guardrail');
  });

  it('رفض سؤال طبي', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('ما علاجي؟');
    expect(reply.warning).toBe('ethical_guardrail');
  });

  it('clear يفرّغ الذاكرة', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    await chat.ask('سؤال');
    chat.clear();
    expect(chat.getHistory().length).toBe(0);
  });

  it('getHistory يعرض المحادثة', async () => {
    const chat = makeOffline();
    chat.loadReport(fakeReport, 'personal');
    await chat.ask('سؤال');
    const history = chat.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ReportChat — with LLM', () => {
  it('يستخدم LLM عند توفر caller', async () => {
    const chat = new ReportChat({
      llmCaller: {
        generate: async () => ({ answer: 'رد من LLM', tokensUsed: 50 }),
      },
    });
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('ما جذري؟');
    expect(reply.content).toBe('رد من LLM');
    expect(reply.tokensUsed).toBe(50);
  });

  it('LLM يفشل → رسالة خطأ', async () => {
    const chat = new ReportChat({
      llmCaller: {
        generate: async () => { throw new Error('network'); },
      },
    });
    chat.loadReport(fakeReport, 'personal');
    const reply = await chat.ask('سؤال');
    expect(reply.content).toContain('تعذّر الاتصال');
  });
});
