import { describe, it, expect } from 'vitest';
import { createAnalyzeNameUseCase } from '../../src/application/di/container';

describe('DI Container — End-to-End', () => {
  const useCase = createAnalyzeNameUseCase();

  it('محمد → تقرير كامل', () => {
    const r = useCase.execute({ name: 'محمد' });
    expect(r.status).toBe('full');
    expect(r.report).toContain('محمد');
    expect(r.report).toContain('درجة الثقة');
    expect(r.layers?.root).toBeDefined();
  });

  it('فاطمة → تقرير كامل', () => {
    const r = useCase.execute({ name: 'فاطمة' });
    expect(r.status).toBe('full');
    expect(r.layers?.planet).toBeDefined();
  });

  it('عبد الرحمن → تقرير كامل', () => {
    const r = useCase.execute({ name: 'عبد الرحمن' });
    expect(r.status).toBe('full');
  });

  it('John → امتناع مع رسالة', () => {
    const r = useCase.execute({ name: 'John' });
    expect(r.status).toBe('abstained');
    expect(r.report).toContain('تقرير امتناع');
    expect(r.report).toContain('اسم غير عربي');
  });

  it('محمد123 → امتناع', () => {
    const r = useCase.execute({ name: 'محمد123' });
    expect(r.status).toBe('abstained');
    expect(r.report).toContain('حروف أو رموز');
  });

  it('overrides تُطبَّق بشكل صحيح', () => {
    const custom = createAnalyzeNameUseCase({
      calculateAbjad: () => 999,
    });
    const r = custom.execute({ name: 'محمد' });
    expect(r.status).toBe('full');
    expect(r.layers?.root).toBe('root_1');
  });

  it('الحسابات العربية صحيحة لأبجد', () => {
    const custom = createAnalyzeNameUseCase();
    const r = custom.execute({ name: 'ا' });
    expect(r.layers?.root).toBe('root_2');
  });

  it('طبقة element محددة', () => {
    const r = useCase.execute({ name: 'محمد' });
    expect(['ناري', 'ترابي', 'هوائي', 'مائي']).toContain(r.layers?.element);
  });
});
