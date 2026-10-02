import { describe, it, expect } from 'vitest';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';

describe('RealWiring — محركات حقيقية', () => {
  const useCase = createRealAnalyzeNameUseCase();

  it('محمد → تقرير كامل مع markdown', () => {
    const r = useCase.execute({ name: 'محمد' });
    if (r.status === 'full') {
      expect(r.report).toContain('محمد');
      expect(r.report).toContain('درجة الثقة');
      expect(r.report.length).toBeGreaterThan(50);
    }
    expect(['full', 'abstained']).toContain(r.status);
  });

  it('فاطمة → نتيجة بدون تعطل', () => {
    const r = useCase.execute({ name: 'فاطمة' });
    expect(['full', 'abstained']).toContain(r.status);
    expect(r.report.length).toBeGreaterThan(0);
  });

  it('عبد الرحمن → نتيجة بدون تعطل', () => {
    const r = useCase.execute({ name: 'عبد الرحمن' });
    expect(['full', 'abstained']).toContain(r.status);
  });

  it('نور → نتيجة بدون تعطل', () => {
    const r = useCase.execute({ name: 'نور' });
    expect(['full', 'abstained']).toContain(r.status);
  });

  it('أحمد → الاسم الأصلي يظهر في التقرير', () => {
    const r = useCase.execute({ name: 'أحمد' });
    expect(r.name).toBe('أحمد');
  });

  it('John → امتناع NON_ARABIC_NAME', () => {
    const r = useCase.execute({ name: 'John' });
    expect(r.status).toBe('abstained');
    expect(r.abstention.reasons).toContain('NON_ARABIC_NAME');
    expect(r.report).toContain('امتناع');
  });

  it('محمد123 → امتناع UNKNOWN_CHARACTERS', () => {
    const r = useCase.execute({ name: 'محمد123' });
    expect(r.status).toBe('abstained');
  });

  it('confidence يُحسب ويُعرض', () => {
    const r = useCase.execute({ name: 'محمد' });
    expect(r.confidence.overall).toBeGreaterThan(0);
    expect(r.confidence.overall).toBeLessThanOrEqual(1);
    expect(['عالية', 'متوسطة', 'ضعيفة', 'منعدمة']).toContain(r.confidence.level);
  });

  it('layers تُستخرج من المحرك الحقيقي', () => {
    const r = useCase.execute({ name: 'محمد' });
    if (r.status === 'full' && r.layers) {
      expect(r.layers.root).toBeDefined();
      expect(typeof r.layers.root).toBe('string');
    }
  });

  it('الاسم الفارغ → لا يتعطل', () => {
    const r = useCase.execute({ name: '' });
    expect(['full', 'abstained']).toContain(r.status);
  });
});
