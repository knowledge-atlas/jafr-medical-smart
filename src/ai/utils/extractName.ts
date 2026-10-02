const ARABIC_ONLY = /^[\u0621-\u064A]{2,12}$/;
const TRIGGER_PATTERN = /(?:حلل|حلّل|شخصية|اعرف|افهم|اقرأ|اقرأي|تحليل)\s+([\u0621-\u064A]{2,15})/;
const WHITELIST_STOPWORDS = /^(ما|كيف|لماذا|متى|أين|هل|من|هو|هي|هذا|هذه|هؤلاء|الذي|التي|الجفر|الرمل|الطب|العلم)$/;

export function extractNameForAnalysis(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();

  const m = trimmed.match(TRIGGER_PATTERN);
  if (m && m[1]) return m[1];

  const cleaned = trimmed.replace(/[؟?!.،,;:]/g, '').trim();
  if (ARABIC_ONLY.test(cleaned) && !WHITELIST_STOPWORDS.test(cleaned)) {
    return cleaned;
  }

  return null;
}
