import { describe, it, expect } from 'vitest';
import { BotEngine } from '../../src/bot/BotEngine';
import { MockAdapter } from '../../src/bot/adapters/MockAdapter';
import { createRealAnalyzeNameUseCase } from '../../src/application/di/realWiring';

const engine = new BotEngine({
  analyzeName: createRealAnalyzeNameUseCase(),
});

const msg = (text: string, chatId = 'test-chat'): any => ({
  chatId,
  userId: 'u1',
  text,
  timestamp: Date.now(),
});

describe('BotEngine — أوامر أساسية', () => {
  it('/start → رسالة ترحيب', async () => {
    const r = await engine.handle(msg('/start'));
    expect(r.text).toContain('KnowledgeAtlas');
    expect(r.text).toContain('/analyze');
  });

  it('/help → قائمة الأوامر', async () => {
    const r = await engine.handle(msg('/help'));
    expect(r.text).toContain('/compat');
    expect(r.text).toContain('/brand');
  });

  it('أمر غير معروف → رسالة إرشاد', async () => {
    const r = await engine.handle(msg('/remedy'));
    expect(r.text).toContain('قيد التطوير');
  });

  it('رسالة فارغة → يُعامل كـ /analyze', async () => {
    const r = await engine.handle(msg(''));
    expect(r.text).toBeDefined();
  });
});

describe('BotEngine — /analyze', () => {
  it('/analyze محمد → markdown', async () => {
    const r = await engine.handle(msg('/analyze محمد'));
    expect(r.text).toContain('محمد');
    expect(r.text.length).toBeGreaterThan(100);
  });

  it('/analyze بدون اسم → رسالة إرشاد', async () => {
    const r = await engine.handle(msg('/analyze'));
    expect(r.text).toContain('استخدم');
  });

  it('/analyze John → امتناع', async () => {
    const r = await engine.handle(msg('/analyze John'));
    expect(r.text).toContain('تعذّر');
  });
});

describe('BotEngine — /compat', () => {
  it('يقارن بين اسمين', async () => {
    const r = await engine.handle(msg('/compat محمد فاطمة'));
    expect(r.text).toContain('محمد');
    expect(r.text).toContain('فاطمة');
  });

  it('ينقص اسم → رسالة إرشاد', async () => {
    const r = await engine.handle(msg('/compat محمد'));
    expect(r.text).toContain('استخدم');
  });
});

describe('BotEngine — /brand', () => {
  it('يولّد تشخيصاً تجارياً', async () => {
    const r = await engine.handle(msg('/brand نوفا'));
    expect(r.text).toContain('نوفا');
    expect(r.text).toContain('بدائل');
  });

  it('مع نشاط', async () => {
    const r = await engine.handle(msg('/brand نوفا شركة تقنية'));
    expect(r.text).toContain('شركة تقنية');
  });
});

describe('BotEngine — /temporal', () => {
  it('يولّد تقويماً افتراضياً 28', async () => {
    const r = await engine.handle(msg('/temporal محمد'));
    expect(r.text).toContain('المتتبع');
    expect(r.text).toContain('ذروة');
  });

  it('مع 7 أيام', async () => {
    const r = await engine.handle(msg('/temporal محمد 7'));
    expect(r.text).toBeDefined();
  });
});

describe('BotEngine — MockAdapter', () => {
  it('يُرسل الردود عبر المحوّل', async () => {
    const adapter = new MockAdapter();
    const reply = await engine.handle(msg('/start'));
    await adapter.send(reply);
    expect(adapter.sent.length).toBe(1);
    expect(adapter.last()?.text).toContain('KnowledgeAtlas');
  });

  it('platform = mock', () => {
    expect(new MockAdapter().platform()).toBe('mock');
  });
});
