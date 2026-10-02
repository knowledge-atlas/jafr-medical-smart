export type AbstentionReason =
  | 'LOW_CONFIDENCE'
  | 'RADICAL_CONFLICT'
  | 'NON_ARABIC_NAME'
  | 'UNKNOWN_CHARACTERS'
  | 'FEEDBACK_CONTRADICTION';

export interface AbstentionInput {
  name: string;
  confidence: number;
  layerConsistency?: number;
  hasRadicalConflict?: boolean;
  feedbackHistory?: Array<{ pattern: string; wasAccurate: boolean }>;
  currentPattern?: string;
}

export interface AbstentionResult {
  shouldAbstain: boolean;
  reasons: AbstentionReason[];
  messages: string[];
}

const ARABIC_ONLY = /^[\u0621-\u064A\s]+$/;

export class AbstentionProtocol {
  private confidenceThreshold: number;

  constructor(confidenceThreshold: number = 0.5) {
    this.confidenceThreshold = confidenceThreshold;
  }

  check(input: AbstentionInput): AbstentionResult {
    const reasons: AbstentionReason[] = [];
    const messages: string[] = [];

    if (input.confidence < this.confidenceThreshold) {
      reasons.push('LOW_CONFIDENCE');
      messages.push(
        `درجة الثقة ${(input.confidence * 100).toFixed(0)}% أقل من الحد الأدنى (${(this.confidenceThreshold * 100).toFixed(0)}%).`
      );
    }

    const layerConflict =
      input.hasRadicalConflict === true ||
      (typeof input.layerConsistency === 'number' && input.layerConsistency < 0.3);
    if (layerConflict) {
      reasons.push('RADICAL_CONFLICT');
      messages.push('يوجد تعارض جذري بين طبقات التحليل (الجذر/الكوكب/البرج).');
    }

    const hasArabic = /[\u0621-\u064A]/.test(input.name);
    if (!hasArabic) {
      reasons.push('NON_ARABIC_NAME');
      messages.push('الاسم لا يحتوي على حروف عربية. يُرجى كتابته بالعربية أو تعريبه.');
    } else if (!ARABIC_ONLY.test(input.name)) {
      reasons.push('UNKNOWN_CHARACTERS');
      messages.push('الاسم يحتوي على حروف أو رموز غير معروفة في نظام الحروف الـ 28.');
    }

    if (this.hasContradiction(input)) {
      reasons.push('FEEDBACK_CONTRADICTION');
      messages.push('نمط مشابه تم تصنيفه سابقاً كغير دقيق أكثر من مرة.');
    }

    return { shouldAbstain: reasons.length > 0, reasons, messages };
  }

  private hasContradiction(input: AbstentionInput): boolean {
    const { feedbackHistory, currentPattern } = input;
    if (!feedbackHistory || !currentPattern) return false;
    const matching = feedbackHistory.filter((h) => h.pattern === currentPattern);
    if (matching.length < 2) return false;
    const inaccurate = matching.filter((h) => !h.wasAccurate).length;
    return inaccurate >= 2 && inaccurate / matching.length >= 0.66;
  }
}
