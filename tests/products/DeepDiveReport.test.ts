import { describe, it, expect } from 'vitest';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { AnalysisResult } from '../../src/application/use-cases/AnalyzeNameUseCase';

const fakeAnalysis: AnalysisResult = {
  status: 'full',
  name: 'محمد',
  confidence: {
    overall: 0.86,
    level: 'عالية',
    dimensions: {
      inputQuality: 1, dataCompleteness: 1, layerConsistency: 1,
      resonanceStrength: 1, wafqClarity: 1, verificationHistory: 1,
    },
    shouldAbstain: false,
    reasons: [],
  },
  abstention: { shouldAbstain: false, reasons: [], messages: [] },
  layers: { root: 'root_2', planet: 'قمر', sign: 'السرطان', house: 'house_8', element: 'ترابي' },
  report: '# التقرير الجفري القياسي\n\n## بيانات السجل\n\nنص غني جداً للموسوعة يجب أن يظهر داخل التقرير.',
};

describe('DeepDiveReport v1.2', () => {
  const engine = new DeepDiveReport();

  it('يولّد 16 قسماً', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.sectionCount).toBe(16);
    expect(out.sections.length).toBe(16);
  });

  it('يحتوي على الاسم في markdown', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('محمد');
  });

  it('يُدرج richMarkdown في قسم encyclopedia', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('التقرير الجفري القياسي');
    expect(out.markdown).toContain('نص غني جداً');
  });

  it('meta صحيح', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.meta.productId).toBe('deep-dive-report');
    expect(out.meta.offline).toBe(true);
    expect(out.meta.version).toBe('1.2.0');
  });

  it('يظهر درجة الثقة', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('86%');
    expect(out.markdown).toContain('عالية');
  });

  it('humanizeLayer يحوّل root_2 إلى "الجذر 2"', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('الجذر 2');
  });

  it('الملخص التنفيذي لا يحوي H1 داخلي', () => {
    const out = engine.generate(fakeAnalysis);
    const execSection = out.sections.find((s) => s.id === 'executive');
    expect(execSection?.content).not.toMatch(/^#\s/);
  });

  it('الموسوعة لا تحوي H1 خام (مُنظّف)', () => {
    const out = engine.generate(fakeAnalysis);
    const enc = out.sections.find((s) => s.id === 'encyclopedia');
    // H1 أصبح H3 (بإزاحة +2)
    expect(enc?.content).not.toMatch(/^#\s/m);
    expect(enc?.content).toMatch(/^###\s/m);
  });

  it('وضع "marital" يعرض توصيات مختلفة', () => {
    const out = engine.generate(fakeAnalysis, 'marital');
    expect(out.markdown).toContain('قراءة مشتركة');
  });

  it('وضع "commercial" يعرض اختبار A/B', () => {
    const out = engine.generate(fakeAnalysis, 'commercial');
    expect(out.markdown).toContain('A/B');
  });

  it('يحوي إخلاء مسؤولية', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.markdown).toContain('إخلاء');
    expect(out.markdown).toContain('لا يُعدّ');
  });

  it('wordCount > 100', () => {
    const out = engine.generate(fakeAnalysis);
    expect(out.wordCount).toBeGreaterThan(100);
  });

  it('يستقبل richMarkdown عبر options', () => {
    const out = engine.generate(fakeAnalysis, 'personal', {
      richMarkdown: '# نص مخصص\n\nمحتوى تجريبي.',
    });
    expect(out.markdown).toContain('نص مخصص');
  });

  it('قسم الظل يذكر الطبع الفعلي', () => {
    const out = engine.generate(fakeAnalysis);
    const shadow = out.sections.find((s) => s.id === 'shadow');
    expect(shadow?.content).toContain('ترابي');
  });

  it('قسم الرنين يحوي علاقات معرّفة', () => {
    const out = engine.generate(fakeAnalysis);
    const res = out.sections.find((s) => s.id === 'resonance');
    expect(res?.content).toContain('الجذر 2');
  });

  it('قسم record يحوي الحقول الأساسية', () => {
    const out = engine.generate(fakeAnalysis);
    const rec = out.sections.find((s) => s.id === 'record');
    expect(rec?.content).toContain('محمد');
    expect(rec?.content).toContain('الجذر 2');
  });

  it('يعمل بدون layers', () => {
    const e: AnalysisResult = { ...fakeAnalysis, layers: undefined };
    const out = engine.generate(e);
    expect(out.sectionCount).toBe(16);
  });
});
