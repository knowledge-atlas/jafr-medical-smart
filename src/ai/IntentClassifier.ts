// ================================================================
// مصنّف النية — محلي بالكامل، بدون إنترنت
// ================================================================

import { Intent, IntentResult } from './types';

// أنماط عربية للتعرف على النية
const PATTERNS: { intent: Intent; regex: RegExp[]; weight: number }[] = [
  {
    intent: 'comparative',
    weight: 1.0,
    regex: [
      /(قارن|مقارنة|الفرق|التوافق|يتوافق|رنين)\s/i,
      /بين\s+.+\s+(و|مع)\s+/i,
    ],
  },
  {
    intent: 'therapeutic',
    weight: 0.95,
    regex: [
      /(علاج|ترياق|كيف\s+أتعامل|كيف\s+أتخلص|الحل|الدواء|الشفاء)/i,
      /(ظل|خلل|انحراف|مشكلة)/i,
    ],
  },
  {
    intent: 'medical',
    weight: 0.95,
    regex: [
      /(مرض|أعراض|دواء|جرعة|ناقل\s+عصبي|هرمون|غدة|خلل\s+طبي)/i,
      /(علاج\s+طبي|تشخيص)/i,
    ],
  },
  {
    intent: 'analytical',
    weight: 0.9,
    regex: [
      /(حلل|حلّل|تحليل|شخصية|صفات|نمط)/i,
      /(من\s+هو|ما\s+هي\s+صفات)/i,
    ],
  },
  {
    intent: 'entity_lookup',
    weight: 0.85,
    regex: [
      /(ما\s+هو|ما\s+هي|عرّف|تعريف|اشرح)\s+(الجذر|الكوكب|البرج|البيت|الطبع|الباقي|الحرف)/i,
      /^(الجذر|الكوكب|البرج|البيت|الطبع|الباقي)\s+\d+/i,
    ],
  },
  {
    intent: 'general',
    weight: 0.5,
    regex: [/.*/],  // fallback
  },
];

// كلمات لكشف الكيانات
const ENTITY_KEYWORDS = [
  'الجذر', 'الكوكب', 'البرج', 'البيت', 'الطبع', 'الباقي',
  'الحرف', 'الشمس', 'القمر', 'عطارد', 'الزهرة', 'المريخ',
  'المشتري', 'زحل', 'أورانوس', 'نبتون', 'بلوتو',
  'الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء',
  'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت',
  'نار', 'تراب', 'هواء', 'ماء', 'ناري', 'ترابي', 'هوائي', 'مائي',
];

const STOP_WORDS = new Set([
  'من', 'في', 'على', 'إلى', 'عن', 'هو', 'هي', 'هذا', 'هذه',
  'التي', 'الذي', 'كان', 'أن', 'إن', 'ما', 'لا', 'و', 'أو',
  'ثم', 'لكن', 'كل', 'بعض', 'كيف', 'متى', 'أين', 'لماذا',
]);

export class IntentClassifier {
  /**
   * تصنيف السؤال
   */
  classify(question: string): IntentResult {
    const normalized = this.normalize(question);
    const scores: Record<Intent, number> = {
      comparative: 0,
      therapeutic: 0,
      medical: 0,
      analytical: 0,
      entity_lookup: 0,
      general: 0,
    };

    // تطبيق الأنماط
    for (const pattern of PATTERNS) {
      for (const regex of pattern.regex) {
        if (regex.test(normalized)) {
          scores[pattern.intent] += pattern.weight;
          break;  // لا نكرر النمط
        }
      }
    }

    // اختيار أعلى نتيجة
    let bestIntent: Intent = 'general';
    let bestScore = 0;
    for (const [intent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as Intent;
      }
    }

    // استخراج الكيانات والكلمات
    const entities = this.extractEntities(normalized);
    const keywords = this.extractKeywords(normalized);

    // كشف الطب
    const medical = scores.medical > 0.5;

    // الثقة: كلما زادت النقاط، زادت الثقة
    const confidence = Math.min(1, bestScore);

    return {
      intent: bestIntent,
      confidence,
      entities,
      keywords,
      medical,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // أدوات
  // ═══════════════════════════════════════════════════════════

  private extractEntities(text: string): string[] {
    const found: string[] = [];
    for (const kw of ENTITY_KEYWORDS) {
      const regex = new RegExp(`${kw}\\s*\\d*`, 'i');
      if (regex.test(text)) {
        const match = text.match(regex);
        if (match) found.push(match[0]);
      }
    }
    return [...new Set(found)];
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .split(/[\s،,.:;!?()\[\]{}«»"'-]+/)
      .map(w => this.normalize(w))
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
    return [...new Set(words)];
  }

  private normalize(text: string): string {
    return text
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ىي]/g, 'ي')
      .replace(/[ةه]/g, 'ه')
      .replace(/[\u064B-\u065F]/g, '')
      .trim();
  }
}
