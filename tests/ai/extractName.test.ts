import { describe, it, expect } from 'vitest';
import { extractNameForAnalysis } from '../../src/ai/utils/extractName';

describe('extractNameForAnalysis', () => {
  it('"حلل محمد" → محمد', () => {
    expect(extractNameForAnalysis('حلل محمد')).toBe('محمد');
  });

  it('"حلّل شخصية فاطمة" → فاطمة', () => {
    expect(extractNameForAnalysis('حلّل شخصية فاطمة')).toBe('فاطمة');
  });

  it('"اعرف شخصية علي" → علي', () => {
    expect(extractNameForAnalysis('اعرف شخصية علي')).toBe('علي');
  });

  it('كلمة عربية واحدة قصيرة → يُعتبر اسماً', () => {
    expect(extractNameForAnalysis('محمد')).toBe('محمد');
  });

  it('"ما هو الجفر؟" → null', () => {
    expect(extractNameForAnalysis('ما هو الجفر؟')).toBeNull();
  });

  it('"كيف حالك" → null (stopword)', () => {
    expect(extractNameForAnalysis('كيف')).toBeNull();
  });

  it('نص فارغ → null', () => {
    expect(extractNameForAnalysis('')).toBeNull();
  });

  it('نص إنجليزي → null', () => {
    expect(extractNameForAnalysis('analyze John')).toBeNull();
  });

  it('جملة طويلة بدون كلمة مفتاحية → null', () => {
    expect(extractNameForAnalysis('هذا سؤال طويل عن المعرفة')).toBeNull();
  });

  it('"تحليل سارة" → سارة', () => {
    expect(extractNameForAnalysis('تحليل سارة')).toBe('سارة');
  });
});
