import { describe, it, expect } from 'vitest';
import { RequestHandler } from '../../src/api/RequestHandler';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';

const handler = new RequestHandler({
  analyzeName: createRealAnalyzeNameUseCase(),
});

describe('RequestHandler — health & listing', () => {
  it('GET /health → 200', () => {
    const r = handler.handle({ method: 'GET', path: '/health' });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it('GET /products → 5 منتجات', () => {
    const r = handler.handle({ method: 'GET', path: '/products' });
    expect(r.status).toBe(200);
    expect(r.body.products.length).toBe(5);
  });

  it('مسار غير معروف → 404', () => {
    const r = handler.handle({ method: 'GET', path: '/unknown' });
    expect(r.status).toBe(404);
  });
});

describe('RequestHandler — analyze', () => {
  it('POST /analyze مع اسم صحيح', () => {
    const r = handler.handle({ method: 'POST', path: '/analyze', body: { name: 'محمد' } });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('full');
  });

  it('POST /analyze بدون اسم → 400', () => {
    const r = handler.handle({ method: 'POST', path: '/analyze', body: {} });
    expect(r.status).toBe(400);
  });

  it('POST /analyze مع اسم غير عربي → abstained', () => {
    const r = handler.handle({ method: 'POST', path: '/analyze', body: { name: 'John' } });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('abstained');
  });
});

describe('RequestHandler — deep-dive', () => {
  it('يولّد تقريراً كاملاً', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/deep-dive',
      body: { name: 'محمد', mode: 'personal' },
    });
    expect(r.status).toBe(200);
    expect(r.body.markdown).toBeDefined();
  });

  it('وضع commercial يعمل', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/deep-dive',
      body: { name: 'نوفا', mode: 'commercial' },
    });
    expect(r.status).toBe(200);
  });
});

describe('RequestHandler — compatibility', () => {
  it('يقارن بين اسمين', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/compatibility',
      body: { nameA: 'محمد', nameB: 'فاطمة' },
    });
    expect(r.status).toBe(200);
    expect(r.body.overallScore).toBeDefined();
  });

  it('ينقص اسم → 400', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/compatibility',
      body: { nameA: 'محمد' },
    });
    expect(r.status).toBe(400);
  });
});

describe('RequestHandler — brand', () => {
  it('يولّد تشخيصاً تجارياً', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/brand',
      body: { name: 'نوفا', activity: 'شركة تقنية' },
    });
    expect(r.status).toBe(200);
    expect(r.body.alternatives.length).toBe(3);
  });
});

describe('RequestHandler — temporal', () => {
  it('يولّد تقويماً 14 يوماً', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/temporal',
      body: { name: 'محمد', days: 14 },
    });
    expect(r.status).toBe(200);
    expect(r.body.calendar.length).toBe(14);
  });

  it('الافتراضي 28 يوماً', () => {
    const r = handler.handle({
      method: 'POST',
      path: '/temporal',
      body: { name: 'محمد' },
    });
    expect(r.body.calendar.length).toBe(28);
  });
});
