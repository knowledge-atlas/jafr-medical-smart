export interface GuardVerdict {
  allowed: boolean;
  reason?: string;
  sanitized?: string;
  warnings: string[];
}

const INPUT_RULES: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /(سأموت|سيموت|متى أموت|أجلي|تاريخ وفاتي)/,
    reason: 'النظام لا يتنبأ بالموت أو الأجل.',
  },
  {
    pattern: /(هل سأشفى|علاجي|دواني|أدوي|يشفيني|يعالجني)/,
    reason: 'النظام ليس بديلاً عن الطبيب ولا يقدم تشخيصاً طبياً.',
  },
  {
    pattern: /(فتوى|حلال|حرام|يجوز لي شرعاً|حكم شرعي)/,
    reason: 'النظام ليس جهة فتوى دينية.',
  },
  {
    pattern: /(قدر لا مفر|مقدر لي|مكتوب علي|لا يمكن تغييره أبداً)/,
    reason: 'النظام لا يتبنى رؤية قدرية قاطعة.',
  },
  {
    pattern: /(قارن بين زوجتي|أخي بدون علمه|ابن عمي سراً)/,
    reason: 'لا مقارنة بين أشخاص دون علمهم.',
  },
];

const OUTPUT_RULES: Array<{ pattern: RegExp; replacement: string; warning: string }> = [
  {
    pattern: /(سوف يحدث لا محالة|بالتأكيد سيحدث|مقدر لك أن)/g,
    replacement: 'قد يميل النمط إلى',
    warning: 'تم تخفيف تنبؤ قاطع',
  },
  {
    pattern: /(يُشفى من|يعالج المرض|يشفي نهائياً)/g,
    replacement: 'قد يُساعد في تحسين الحالة بالتعاون مع مختص',
    warning: 'تم تحييد ادعاء طبي',
  },
  {
    pattern: /(أنت بالضبط|أنت بالضرورة|لا شك أنك)/g,
    replacement: 'يبدو أن النمط يميل إلى',
    warning: 'تم تخفيف حكم قاطع',
  },
];

export class EthicalGuardrails {
  checkInput(question: string): GuardVerdict {
    const warnings: string[] = [];
    for (const rule of INPUT_RULES) {
      if (rule.pattern.test(question)) {
        return { allowed: false, reason: rule.reason, warnings: [rule.reason] };
      }
    }
    return { allowed: true, warnings };
  }

  checkOutput(text: string): GuardVerdict {
    let sanitized = text;
    const warnings: string[] = [];
    for (const rule of OUTPUT_RULES) {
      if (rule.pattern.test(sanitized)) {
        sanitized = sanitized.replace(rule.pattern, rule.replacement);
        warnings.push(rule.warning);
      }
    }
    return { allowed: true, sanitized, warnings };
  }
}

export const ethicalGuardrails = new EthicalGuardrails();
