import { describe, it, expect } from 'vitest';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';
import { DeepDiveReport } from '../../src/products/DeepDiveReport';
import { CompatibilityEngine } from '../../src/products/CompatibilityEngine';
import { BrandDiagnostic } from '../../src/products/BrandDiagnostic';
import { TemporalTracker } from '../../src/products/TemporalTracker';
import { RemedyTracker } from '../../src/products/RemedyTracker';
import { RequestHandler } from '../../src/api/RequestHandler';
import { BotEngine } from '../../src/bot/BotEngine';
import { HybridEngine } from '../../src/ai/HybridEngine';

const analyzeName = createRealAnalyzeNameUseCase();
const deepDive = new DeepDiveReport();
const compatibility = new CompatibilityEngine();
const brand = new BrandDiagnostic();
const temporal = new TemporalTracker();
const remedy = new RemedyTracker();

describe('E2E — رحلة مستخدم كاملة', () => {
  it('1) مستخدم جديد يحلل اسمه عبر Deep-Dive', () => {
    const a = analyzeName.execute({ name: 'محمد' });
    expect(a.status).toBe('full');
    const out = deepDive.generate(a, 'personal');
    expect(out.sectionCount).toBe(17);
    expect(out.markdown).toContain('محمد');
  });

  it('2) يطلب تحليل توافق مع شريكة حياته', () => {
    const a = analyzeName.execute({ name: 'محمد' });
    const b = analyzeName.execute({ name: 'فاطمة' });
    const out = compatibility.compare(a, b);
    expect(out.dimensions.length).toBe(7);
    expect(out.overallScore).toBeGreaterThan(0);
  });

  it('3) يقرأ تقويمه الزمني للأسبوع القادم', () => {
    const a = analyzeName.execute({ name: 'محمد' });
    const out = temporal.generate(a, new Date(), 7);
    expect(out.calendar.length).toBe(7);
    expect(out.peakDays.length).toBeGreaterThanOrEqual(0);
  });

  it('4) ينشئ توصية ويتابعها أسبوعاً', () => {
    let remedies = remedy.addRemedy([], 'التأمل اليومي', '10 دقائق', 'daily', 7);
    const rid = remedies[0].id;
    let logs: any[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-10-01');
      d.setDate(d.getDate() + i);
      logs = remedy.log(logs, rid, true, d);
    }
    const out = remedy.generateReport('محمد', remedies, logs, new Date('2026-10-10'));
    expect(out.overallAdherence).toBe(1);
    expect(out.progress[0].streak).toBe(7);
  });

  it('5) يفتح مشروعاً تجارياً جديداً ويشخّص اسمه', () => {
    const a = analyzeName.execute({ name: 'نوفا' });
    const out = brand.analyze(a, 'شركة تقنية');
    expect(out.alternatives.length).toBe(3);
    expect(out.dimensions.length).toBe(6);
  });
});

describe('E2E — عبر الـ API', () => {
  const handler = new RequestHandler({ analyzeName });

  it('سيناريو: طلب تحليل ثم deep-dive', () => {
    const r1 = handler.handle({
      method: 'POST', path: '/analyze', body: { name: 'محمد' },
    });
    expect(r1.status).toBe(200);

    const r2 = handler.handle({
      method: 'POST', path: '/deep-dive',
      body: { name: 'محمد', mode: 'professional' },
    });
    expect(r2.status).toBe(200);
    expect(r2.body.markdown).toContain('محمد');
  });

  it('سيناريو: قائمة المنتجات ثم استدعاء كل منتج', () => {
    const products = handler.handle({ method: 'GET', path: '/products' });
    expect(products.body.products.length).toBe(5);

    const endpoints = [
      { path: '/analyze', body: { name: 'محمد' } },
      { path: '/deep-dive', body: { name: 'محمد' } },
      { path: '/compatibility', body: { nameA: 'محمد', nameB: 'فاطمة' } },
      { path: '/brand', body: { name: 'نوفا' } },
      { path: '/temporal', body: { name: 'محمد' } },
    ];
    for (const e of endpoints) {
      const r = handler.handle({ method: 'POST', path: e.path, body: e.body });
      expect(r.status).toBe(200);
    }
  });
});

describe('E2E — عبر البوت', () => {
  const bot = new BotEngine({ analyzeName });

  const msg = (text: string): any => ({
    chatId: 'e2e-chat', userId: 'u1', text, timestamp: Date.now(),
  });

  it('سيناريو: مستخدم يبدأ ثم يحلل', async () => {
    const r1 = await bot.handle(msg('/start'));
    expect(r1.text).toContain('KnowledgeAtlas');

    const r2 = await bot.handle(msg('/analyze محمد'));
    expect(r2.text.length).toBeGreaterThan(100);
  });

  it('سيناريو: مستخدم يقارن بين اسمين', async () => {
    const r = await bot.handle(msg('/compat محمد فاطمة'));
    expect(r.text).toContain('التوافق');
  });

  it('سيناريو: مستخدم يحلل جانبه التجاري', async () => {
    const r = await bot.handle(msg('/brand نوفا مطعم'));
    expect(r.text).toContain('نوفا');
  });
});

describe('E2E — عبر HybridEngine', () => {
  const engine = new HybridEngine({ analyzer: analyzeName });

  it('سيناريو شخصي offline', async () => {
    const r = await engine.process({
      question: 'حلل شخصيتي',
      nameForAnalysis: 'محمد',
      mode: 'personal',
    });
    expect(r.layer).toBe('A');
    expect(r.offline).toBe(true);
    expect(r.answer).toContain('محمد');
  });

  it('سيناريو زواجي', async () => {
    const r = await engine.process({
      question: 'ما توافقنا؟',
      nameForAnalysis: 'فاطمة',
      mode: 'marital',
    });
    expect(r.answer.length).toBeGreaterThan(50);
  });

  it('حماية أخلاقية: سؤال مرفوض', async () => {
    const r = await engine.process({
      question: 'هل سأموت قريباً؟',
      nameForAnalysis: 'محمد',
    });
    expect(r.answer).toContain('لا يمكنني');
  });
});

describe('E2E — الحالات الحدية', () => {
  it('أسماء متعددة بأحرف خاصة', () => {
    const names = ['محمد', 'عبد الرحمن', 'أحمد', 'نور', 'يوسف'];
    for (const n of names) {
      const a = analyzeName.execute({ name: n });
      expect(['full', 'abstained']).toContain(a.status);
    }
  });

  it('أسماء غير عربية → امتناع متسق', () => {
    const names = ['John', 'Mary', 'Alice'];
    for (const n of names) {
      const a = analyzeName.execute({ name: n });
      expect(a.status).toBe('abstained');
    }
  });

  it('مدخلات شاذة لا تُسقط النظام', () => {
    const weird = ['', '  ', '123', '!!!', 'م ح م د'];
    for (const w of weird) {
      const a = analyzeName.execute({ name: w });
      expect(['full', 'abstained']).toContain(a.status);
    }
  });

  it('100 اسم عربي — لا انهيار', () => {
    const prefixes = ['محمد', 'أحمد', 'علي', 'فاطمة', 'زينب', 'خالد', 'سارة', 'يوسف'];
    for (let i = 0; i < 100; i++) {
      const name = prefixes[i % prefixes.length] + (i % 7 === 0 ? ' عبد الله' : '');
      const a = analyzeName.execute({ name });
      expect(['full', 'abstained']).toContain(a.status);
    }
  });
});
