import { describe, it, expect } from 'vitest';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';

const analyzeName = createRealAnalyzeNameUseCase();
const deepDive = new DeepDiveReport();

describe('E2E — الأداء', () => {
  it('تحليل اسم واحد < 200ms', () => {
    const t0 = Date.now();
    analyzeName.execute({ name: 'محمد' });
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(200);
  });

  it('توليد تقرير كامل < 300ms', () => {
    const a = analyzeName.execute({ name: 'محمد' });
    const t0 = Date.now();
    deepDive.generate(a);
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(300);
  });

  it('100 تحليل متتالي < 10 ثوان', () => {
    const t0 = Date.now();
    for (let i = 0; i < 100; i++) {
      analyzeName.execute({ name: `الاسم${i}` });
    }
    const dt = Date.now() - t0;
    expect(dt).toBeLessThan(10000);
  });
});
