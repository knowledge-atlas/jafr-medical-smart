const ARABIC_WORD = /^[\u0621-\u064A]{2,15}$/;

// كلمات تشير إلى رغبة صريحة في التحليل
const TRIGGER_WORDS = new Set([
  'حلل', 'حلّل', 'تحليل', 'حللي', 'شخصية', 'شخصيتي', 'شخصيته',
  'اعرف', 'أعرف', 'افهم', 'أفهم', 'اقرأ', 'اقرأي', 'أقرأ',
  'توافق', 'قارن', 'قارني', 'براند', 'تجاري', 'تجارية',
  'مهني', 'مهنية', 'زوجي', 'زوجية', 'شخصي',
  'اعطني', 'أعطني', 'اعرض', 'اعرضي',
]);

// كلمات لا تُعدّ أسماءً أبداً
const STOPWORDS = new Set([
  'ما', 'كيف', 'لماذا', 'متى', 'أين', 'هل', 'من', 'هو', 'هي',
  'هذا', 'هذه', 'هؤلاء', 'الذي', 'التي', 'ذلك', 'تلك',
  'مع', 'عن', 'في', 'على', 'إلى', 'الى', 'لي', 'لك',
  'أتعامل', 'تعامل', 'أستخدم', 'استخدم', 'أريد', 'أحتاج',
  'الجفر', 'الرمل', 'الطب', 'العلم', 'المعرفة', 'الجذر', 'الجذور',
  'الكوكب', 'الكواكب', 'البرج', 'الأبراج', 'البيت', 'البيوت',
  'الطبع', 'الطبائع', 'سؤال', 'طويل', 'جميل', 'كبير', 'صغير',
  'كل', 'بعض', 'شيء',
]);

export function extractNameForAnalysis(text: string): string | null {
  if (!text) return null;

  const cleaned = text.replace(/[؟?!.،,;:«»"']/g, ' ').trim();
  if (!cleaned) return null;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const hasTrigger = tokens.some((t) => TRIGGER_WORDS.has(t));

  // قاعدة A: يوجد trigger → ابحث عن أول كلمة عربية صافية ليست trigger/stopword
  if (hasTrigger) {
    for (const token of tokens) {
      if (!ARABIC_WORD.test(token)) continue;
      if (TRIGGER_WORDS.has(token)) continue;
      if (STOPWORDS.has(token)) continue;
      return token;
    }
    return null;
  }

  // قاعدة B: لا يوجد trigger → النص يجب أن يكون كلمة عربية واحدة فقط
  if (tokens.length === 1) {
    const only = tokens[0];
    if (ARABIC_WORD.test(only) && !STOPWORDS.has(only) && !TRIGGER_WORDS.has(only)) {
      return only;
    }
  }

  return null;
}
