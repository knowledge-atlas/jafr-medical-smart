import { normalizeArabic } from './utils.mjs';

export const ALLOWED_TYPES = [
  'root', 'planet', 'sign', 'house', 'element', 'letter',
  'remainder', 'compound', 'resonance', 'medical', 'remedy', 'wafq',
];

// ═══════════════════════════════════════════════════════════
// هل الكيان يتوافق مع التطبيق؟
// ═══════════════════════════════════════════════════════════
export function isCompatible(entity) {
  if (!entity) return false;

  // 1) نوع صحيح
  if (!ALLOWED_TYPES.includes(entity.entityType)) {
    return false;
  }

  // 2) نص كافٍ
  if (!entity.fullText || entity.fullText.length < 80) {
    return false;
  }

  // 3) عنوان
  if (!entity.titleAr || entity.titleAr.length < 2) {
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════
// هل يحتوي النص على كلمات مفتاحية مطابقة؟
// ═══════════════════════════════════════════════════════════
export function matchesKeywords(entity, keywords = []) {
  if (keywords.length === 0) return true;

  const normalizedText = normalizeArabic(entity.fullText);
  const normalizedTitle = normalizeArabic(entity.titleAr);

  return keywords.some((kw) => {
    const n = normalizeArabic(kw);
    if (!n) return false;
    return normalizedText.includes(n) || normalizedTitle.includes(n);
  });
}

// ═══════════════════════════════════════════════════════════
// إزالة التكرار
// ═══════════════════════════════════════════════════════════
export function dedupe(entities) {
  const seen = new Set();
  const out = [];
  for (const e of entities) {
    const key = `${e.entityType}::${normalizeArabic(e.titleAr)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
