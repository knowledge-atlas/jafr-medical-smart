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


/**
 * يحذف "مدخل إلى طبيعة..." من بداية نصوص الجذور
 * ويستبدلها بتعريف مختصر
 */
export const stripRootIntro = (text: string): string => {
  if (!text) return '';
  
  // احذف أول قسم يبدأ بـ "مدخل إلى" حتى أول سطر يبدأ بـ "1." أو "## " أو "التعريف"
  const lines = text.split('\n');
  const out: string[] = [];
  let skipping = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // بداية تخطي
    if (line.startsWith('مدخل إلى') || line.startsWith('مدخل الى')) {
      skipping = true;
      continue;
    }
    
    // نهاية تخطي — عند أول قسم مرقّم أو عنوان
    if (skipping && (
      /^\d+\.\s/.test(line) ||
      /^#{1,3}\s/.test(line) ||
      line.startsWith('التعريف') ||
      line.startsWith('الباطن والظاهر') ||
      line.startsWith('الهوية العامة') ||
      line.startsWith('【')
    )) {
      skipping = false;
    }
    
    if (!skipping) {
      out.push(lines[i]);
    }
  }
  
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

/**
 * تقسيم النص إلى فئات (صفات إيجابية / سلبية / عمق)
 */
export interface TraitBlock {
  type: 'positive' | 'negative' | 'depth' | 'other';
  title: string;
  content: string;
}

export const parseElementTraits = (text: string): TraitBlock[] => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const blocks: TraitBlock[] = [];
  let current: TraitBlock | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // كشف بداية قسم جديد
    if (/الصفات الإيجابية|الإيجابيات|النقاط الإيجابية|ميزات إيجابية/i.test(trimmed)) {
      if (current) blocks.push(current);
      current = { type: 'positive', title: '✅ الصفات الإيجابية', content: '' };
      continue;
    }
    
    if (/الصفات السلبية|السلبيات|النقاط السلبية|الظل|ميزات سلبية/i.test(trimmed)) {
      if (current) blocks.push(current);
      current = { type: 'negative', title: '⚠️ الصفات السلبية / الظل', content: '' };
      continue;
    }
    
    if (/العمق الداخلي|العمق|الجوهر الداخلي/i.test(trimmed) && /:/.test(trimmed)) {
      if (current) blocks.push(current);
      current = { type: 'depth', title: '🔍 العمق الداخلي', content: '' };
      // احذف عنوان القسم واترك الباقي
      const rest = trimmed.replace(/^[^:]+:\s*/, '');
      if (rest) current.content += rest + '\n';
      continue;
    }
    
    if (current) {
      current.content += line + '\n';
    }
  }
  
  if (current) blocks.push(current);
  return blocks.filter(b => b.content.trim().length > 0);
};
