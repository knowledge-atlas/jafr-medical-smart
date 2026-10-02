// ================================================================
// ConfidenceEngine — محرك الثقة ذاتي المعايرة
// المهمة 1.2 من المرحلة 1
// ================================================================
// 
// يقيس درجة الثقة في التحليل عبر 6 محاور مستقلة:
// 1. جودة الإدخال (15%)
// 2. اكتمال البيانات (20%)
// 3. تناسق الطبقات (25%)
// 4. قوة الرنين (20%)
// 5. وضوح الوفق (10%)
// 6. تاريخ التحقق (10%)
// ================================================================

export interface ConfidenceInput {
  name: string;
  letters: string[];
  root: number;
  planet: string;
  sign: string;
  element: string;
  house: number;
  resonance?: any;
  wafq?: any;
  existingRecords?: {
    hasRoot?: boolean;
    hasPlanet?: boolean;
    hasSign?: boolean;
    hasHouse?: boolean;
    hasElement?: boolean;
    hasLetters?: boolean;
  };
}

export interface ConfidenceBreakdown {
  inputQuality: number;       // 0-100
  dataCompleteness: number;   // 0-100
  layerConsistency: number;   // 0-100
  resonanceStrength: number;  // 0-100
  wafqClarity: number;        // 0-100
  verificationHistory: number;// 0-100
}

export interface ConfidenceResult {
  total: number;              // 0-100
  level: string;              // ممتنعة/ضعيفة/متوسطة/قوية/يقينية
  levelId: number;            // 0-10
  breakdown: ConfidenceBreakdown;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// الأوزان الرسمية للـ 6 محاور
// ═══════════════════════════════════════════════════════════════

const WEIGHTS = {
  inputQuality: 0.15,
  dataCompleteness: 0.20,
  layerConsistency: 0.25,
  resonanceStrength: 0.20,
  wafqClarity: 0.10,
  verificationHistory: 0.10,
};

// ═══════════════════════════════════════════════════════════════
// مستويات الثقة (0-10)
// ═══════════════════════════════════════════════════════════════

const LEVELS = [
  { id: 0, min: 0,  max: 10, name: 'ممتنعة' },
  { id: 1, min: 10, max: 20, name: 'واهية' },
  { id: 2, min: 20, max: 30, name: 'ضعيفة' },
  { id: 3, min: 30, max: 40, name: 'متوسطة مائلة للضعف' },
  { id: 4, min: 40, max: 50, name: 'متوسطة' },
  { id: 5, min: 50, max: 60, name: 'متوسطة مائلة للقوة' },
  { id: 6, min: 60, max: 70, name: 'قوية' },
  { id: 7, min: 70, max: 80, name: 'قوية جداً' },
  { id: 8, min: 80, max: 90, name: 'شبه يقينية' },
  { id: 9, min: 90, max: 95, name: 'يقينية' },
  { id: 10, min: 95, max: 101, name: 'يقين مطلق' },
];

// ═══════════════════════════════════════════════════════════════
// توافق الطبقات: قواعد التعارض الجذري
// ═══════════════════════════════════════════════════════════════

const ELEMENT_COMPATIBILITY: Record<string, string[]> = {
  'نار':  ['نار', 'هواء', 'تراب'],
  'تراب': ['تراب', 'ماء', 'نار'],
  'هواء': ['هواء', 'نار', 'ماء'],
  'ماء':  ['ماء', 'تراب', 'هواء'],
};

const PLANET_ELEMENT_COMPATIBILITY: Record<string, string[]> = {
  'الشمس':  ['نار', 'هواء'],
  'القمر':  ['ماء', 'تراب'],
  'عطارد':  ['هواء', 'تراب'],
  'الزهرة': ['هواء', 'تراب'],
  'المريخ': ['نار', 'هواء'],
  'المشتري':['نار', 'هواء'],
  'زحل':    ['تراب', 'ماء'],
  'أورانوس':['هواء', 'نار'],
  'نبتون':  ['ماء', 'هواء'],
  'بلوتو':  ['ماء', 'تراب'],
};

// ═══════════════════════════════════════════════════════════════
// المحرك الرئيسي
// ═══════════════════════════════════════════════════════════════

export class ConfidenceEngine {
  /**
   * الحساب الرئيسي — يرجّع درجة الثقة الكاملة
   */
  calculate(input: ConfidenceInput): ConfidenceResult {
    const warnings: string[] = [];

    const inputQuality = this.calcInputQuality(input, warnings);
    const dataCompleteness = this.calcDataCompleteness(input, warnings);
    const layerConsistency = this.calcLayerConsistency(input, warnings);
    const resonanceStrength = this.calcResonanceStrength(input, warnings);
    const wafqClarity = this.calcWafqClarity(input, warnings);
    const verificationHistory = this.calcVerificationHistory(input, warnings);

    const breakdown: ConfidenceBreakdown = {
      inputQuality,
      dataCompleteness,
      layerConsistency,
      resonanceStrength,
      wafqClarity,
      verificationHistory,
    };

    const total = Math.round(
      inputQuality * WEIGHTS.inputQuality +
      dataCompleteness * WEIGHTS.dataCompleteness +
      layerConsistency * WEIGHTS.layerConsistency +
      resonanceStrength * WEIGHTS.resonanceStrength +
      wafqClarity * WEIGHTS.wafqClarity +
      verificationHistory * WEIGHTS.verificationHistory
    );

    const levelData = this.getLevel(total);

    return {
      total,
      level: levelData.name,
      levelId: levelData.id,
      breakdown,
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. جودة الإدخال (15%)
  // ═══════════════════════════════════════════════════════════════

  private calcInputQuality(input: ConfidenceInput, warnings: string[]): number {
    if (!input.name || !input.letters || input.letters.length === 0) {
      warnings.push('⚠️ لا توجد أحرف في الإدخال');
      return 0;
    }

    const nameLength = input.name.trim().length;
    const letterCount = input.letters.length;

    // كلما زاد عدد الأحرف، زادت الجودة (حتى حد أقصى)
    let score = Math.min(letterCount / 5, 1.0) * 60; // 0-60

    // مكافأة إذا كان عدد الأحرف يطابق طول الاسم
    if (letterCount === nameLength) {
      score += 20;
    } else {
      const match = letterCount / nameLength;
      score += match * 20;
    }

    // مكافأة إذا كان الاسم بين 3-10 أحرف
    if (letterCount >= 3 && letterCount <= 10) {
      score += 20;
    } else if (letterCount < 3) {
      warnings.push('⚠️ الاسم قصير جداً (أقل من 3 أحرف)');
    }

    return Math.min(100, Math.max(0, score));
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. اكتمال البيانات (20%)
  // ═══════════════════════════════════════════════════════════════

  private calcDataCompleteness(input: ConfidenceInput, warnings: string[]): number {
    const checks = [
      { key: 'hasRoot', present: input.root > 0, weight: 20, label: 'الجذر' },
      { key: 'hasPlanet', present: !!input.planet, weight: 15, label: 'الكوكب' },
      { key: 'hasSign', present: !!input.sign, weight: 15, label: 'البرج' },
      { key: 'hasHouse', present: input.house > 0, weight: 15, label: 'البيت' },
      { key: 'hasElement', present: !!input.element, weight: 10, label: 'الطبع' },
      { key: 'hasLetters', present: input.letters?.length > 0, weight: 10, label: 'الحروف' },
    ];

    let score = 0;
    for (const check of checks) {
      if (check.present) {
        score += check.weight;
      } else {
        warnings.push(`⚠️ عنصر مفقود: ${check.label}`);
      }
    }

    // إذا كانت السجلات المُمرَّرة موجودة، احسبها
    if (input.existingRecords) {
      const recordChecks = Object.values(input.existingRecords);
      const presentCount = recordChecks.filter(Boolean).length;
      // مكافأة صغيرة للاكتمال الإضافي
      score = Math.min(100, score + presentCount * 2);
    }

    // مكافأة للرنين
    if (input.resonance) score += 5;

    return Math.min(100, score);
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. تناسق الطبقات (25%) — الأهم
  // ═══════════════════════════════════════════════════════════════

  private calcLayerConsistency(input: ConfidenceInput, warnings: string[]): number {
    let score = 100;
    const penalties: string[] = [];

    // فحص 1: توافق الكوكب مع الطبع
    const planetElementCompat = PLANET_ELEMENT_COMPATIBILITY[input.planet];
    if (planetElementCompat && !planetElementCompat.includes(input.element)) {
      score -= 20;
      penalties.push(`كوكب ${input.planet} لا يتوافق مع طبع ${input.element}`);
    }

    // فحص 2: توافق الجذر مع الطبع (كل جذر له طبع مفضل)
    const rootElementMap: Record<number, string[]> = {
      1: ['نار', 'هواء'],
      2: ['ماء', 'تراب'],
      3: ['هواء', 'نار'],
      4: ['تراب', 'ماء'],
      5: ['هواء', 'ماء'],
      6: ['هواء', 'تراب'],
      7: ['ماء', 'هواء'],
      8: ['تراب', 'ماء'],
      9: ['نار', 'هواء'],
    };
    const rootCompat = rootElementMap[input.root];
    if (rootCompat && !rootCompat.includes(input.element)) {
      score -= 15;
      penalties.push(`الجذر ${input.root} مع طبع ${input.element} غير متناسق`);
    }

    // فحص 3: البيت مقابل الجذر (قواعد تقليدية)
    const houseRootCompat: Record<number, number[]> = {
      1: [1], 2: [4], 3: [3], 4: [2], 5: [1, 5], 6: [4],
      7: [2, 6], 8: [8], 9: [3, 9], 10: [1, 8], 11: [3, 5], 12: [7, 9],
    };
    if (houseRootCompat[input.house] && !houseRootCompat[input.house].includes(input.root)) {
      score -= 10;
      penalties.push(`البيت ${input.house} لا يتوافق مع الجذر ${input.root}`);
    }

    // فحص 4: هل الطبع موجود في العناصر أصلاً؟
    if (!['نار', 'تراب', 'هواء', 'ماء'].includes(input.element)) {
      score -= 25;
      penalties.push('الطبع غير معروف');
    }

    // فحص 5: هل الجذر في النطاق الصحيح؟
    if (input.root < 1 || input.root > 9) {
      score -= 30;
      penalties.push('الجذر خارج النطاق 1-9');
    }

    // فحص 6: هل البيت في النطاق الصحيح؟
    if (input.house < 1 || input.house > 12) {
      score -= 20;
      penalties.push('البيت خارج النطاق 1-12');
    }

    // إضافة التحذيرات
    if (penalties.length > 0) {
      warnings.push(...penalties.map(p => `⚠️ تعارض: ${p}`));
    }

    return Math.max(0, score);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. قوة الرنين (20%)
  // ═══════════════════════════════════════════════════════════════

  private calcResonanceStrength(input: ConfidenceInput, warnings: string[]): number {
    // إذا لم يوجد رنين مُمرَّر، امنح درجة محايدة
    if (!input.resonance) {
      return 70; // محايد
    }

    let score = 50;

    // فحص الرنين
    if (input.resonance.description || input.resonance.shadow || input.resonance.remedy) {
      score += 25;
    }

    if (input.resonance.compatibleWith && input.resonance.compatibleWith.length > 0) {
      score += 10;
    }

    if (input.resonance.conflictsWith && input.resonance.conflictsWith.length > 0) {
      score += 5;
    }

    if (input.resonance.classification) {
      score += 10;
    }

    return Math.min(100, score);
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. وضوح الوفق (10%)
  // ═══════════════════════════════════════════════════════════════

  private calcWafqClarity(input: ConfidenceInput, warnings: string[]): number {
    if (!input.wafq) {
      return 60; // محايد — الوفق ليس مطلوباً لكل التحليلات
    }

    let score = 50;

    // إذا كان الوفق شبكة (array of arrays)
    if (Array.isArray(input.wafq)) {
      if (input.wafq.length === 3 && input.wafq[0]?.length === 3) {
        score += 30; // مربع 3x3 صحيح
      } else if (input.wafq.length > 0) {
        score += 15;
      }
    }

    return Math.min(100, score);
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. تاريخ التحقق (10%)
  // ═══════════════════════════════════════════════════════════════

  private calcVerificationHistory(input: ConfidenceInput, warnings: string[]): number {
    // القيمة الافتراضية 100% — أي أن كل تقرير جديد يبدأ بيقين افتراضي
    // ثم يتقلص مع كل تغذية راجعة سلبية (في المستقبل)
    return 100;
  }

  // ═══════════════════════════════════════════════════════════════
  // تحديد المستوى
  // ═══════════════════════════════════════════════════════════════

  private getLevel(total: number): { id: number; name: string } {
    for (const level of LEVELS) {
      if (total >= level.min && total < level.max) {
        return { id: level.id, name: level.name };
      }
    }
    return { id: 10, name: 'يقين مطلق' };
  }

  /**
   * هل يجب الامتناع عن الحكم؟
   */
  shouldAbstain(result: ConfidenceResult): boolean {
    return result.total < 50;
  }

  /**
   * مستوى الثقة المُختصر (مفيد للعرض)
   */
  getLevelEmoji(levelId: number): string {
    if (levelId >= 9) return '🟢';
    if (levelId >= 6) return '🟡';
    if (levelId >= 4) return '🟠';
    return '🔴';
  }
}

// نسخة Singleton جاهزة
export const confidenceEngine = new ConfidenceEngine();
