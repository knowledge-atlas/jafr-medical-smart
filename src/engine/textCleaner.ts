// ================================================================
// منظّف النصوص — نسخة كاملة وآمنة
// ================================================================

/**
 * ينظف أي نص عام من الوسوم البرمجية
 * آمن ضد: undefined, null, numbers, objects
 */
export const cleanGenericText = (text: any): string => {
  if (text === undefined || text === null) return '';
  if (typeof text === 'number' || typeof text === 'boolean') return String(text);
  if (typeof text !== 'string') {
    try { return JSON.stringify(text); } catch { return ''; }
  }
  if (text.length === 0) return text;

  let cleaned: string = text;
  cleaned = cleaned.replace(/^\s*"\w+":\s*.*$/gm, '');
  cleaned = cleaned.replace(/^\s*id:\s*"[^"]+".*$/gm, '');
  cleaned = cleaned.replace(/^\s*name:\s*"[^"]+".*$/gm, '');
  cleaned = cleaned.replace(/^\s*fullDescription:\s*.*$/gm, '');
  cleaned = cleaned.replace(/^\s*source\d?:\s*.*$/gm, '');
  cleaned = cleaned.replace(/^\s*[{}\[\],]\s*$/gm, '');
  cleaned = cleaned.replace(/"\w+":\s*/g, '');
  cleaned = cleaned.replace(/`/g, '');
  cleaned = cleaned.replace(/^\s*,+\s*$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
};

/**
 * ينظف نصوص الجذور (يحافظ على كل المحتوى)
 * لا يحذف أي معلومة معرفية
 */
export const cleanRootText = (text: any, rootNum?: number): string => {
  if (!text) return '';
  if (typeof text !== 'string') {
    try { text = JSON.stringify(text); } catch { return ''; }
  }
  let cleaned: string = text;

  // إزالة backticks فقط
  cleaned = cleaned.replace(/`/g, '');

  // إزالة علامات JSON الباقية
  cleaned = cleaned.replace(/^\s*"{1,}\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*[{}\[\]]\s*$/gm, '');

  // إزالة المسافات الزائدة
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  return cleaned.trim();
};

/**
 * استخراج عنوان قصير من النص
 */
export const extractTitle = (text: any, fallback: string = 'بدون عنوان'): string => {
  if (!text || typeof text !== 'string') return fallback;
  const firstLine = text.split('\n')[0].replace(/^#+\s*/, '').trim();
  if (firstLine.length > 0 && firstLine.length < 100) return firstLine;
  return fallback;
};

/**
 * نسخة قصيرة للعرض
 */
export const cleanShort = (text: any, maxLength: number = 150): string => {
  const cleaned = cleanGenericText(text);
  return cleaned.length <= maxLength ? cleaned : cleaned.substring(0, maxLength) + '...';
};

/**
 * تعقيم أي كائن معقد إلى نص قابل للعرض
 */
export const safeToString = (value: any): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value, null, 2); } catch { return '[قيمة غير قابلة للعرض]'; }
};

export default cleanGenericText;
