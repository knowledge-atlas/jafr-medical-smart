// ================================================================
// ArabicNormalizer — معالج النصوص العربية
// المهمة 1.1 من المرحلة 1
// ================================================================

export interface NormalizeOptions {
  removeAlTaarif?: boolean;
  collapseDuplicates?: boolean;
  removeSpaces?: boolean;
}

export interface NormalizeResult {
  original: string;
  normalized: string;
  transformations: string[];
}

export class ArabicNormalizer {
  /**
   * التطبيع الكامل مع خيارات
   */
  normalize(input: string, options: NormalizeOptions = {}): string {
    if (!input || typeof input !== 'string') return '';

    let result = input.trim();
    result = this.normalizeAlef(result);
    result = this.normalizeYaa(result);
    result = this.normalizeTaaMarbuta(result);
    result = this.removeTashkeel(result);
    result = this.removeTatweel(result);

    if (options.removeSpaces !== false) {
      result = this.removeSpaces(result);
    }

    if (options.collapseDuplicates) {
      result = this.collapseDuplicates(result);
    }

    if (options.removeAlTaarif) {
      result = this.removeAlTaarif(result);
    }

    return result;
  }

  /**
   * تحليل مفصل مع سرد التحويلات
   */
  analyze(input: string): NormalizeResult {
    if (!input) {
      return { original: '', normalized: '', transformations: [] };
    }

    const transformations: string[] = [];
    let result = input.trim();

    const beforeAlef = result;
    result = this.normalizeAlef(result);
    if (beforeAlef !== result) transformations.push('توحيد الألفات');

    const beforeYaa = result;
    result = this.normalizeYaa(result);
    if (beforeYaa !== result) transformations.push('توحيد الياءات');

    const beforeTaa = result;
    result = this.normalizeTaaMarbuta(result);
    if (beforeTaa !== result) transformations.push('التاء المربوطة → هاء');

    const beforeTashkeel = result;
    result = this.removeTashkeel(result);
    if (beforeTashkeel !== result) transformations.push('إزالة التشكيل');

    const beforeTatweel = result;
    result = this.removeTatweel(result);
    if (beforeTatweel !== result) transformations.push('إزالة الكشيدة');

    const beforeSpaces = result;
    result = this.removeSpaces(result);
    if (beforeSpaces !== result) transformations.push('إزالة المسافات الزائدة');

    return {
      original: input,
      normalized: result,
      transformations,
    };
  }

  /**
   * توحيد الألفات: أ، إ، آ، ٱ → ا
   */
  normalizeAlef(text: string): string {
    return text.replace(/[أإآٱ]/g, 'ا');
  }

  /**
   * توحيد الياءات: ى → ي
   */
  normalizeYaa(text: string): string {
    return text.replace(/ى/g, 'ي');
  }

  /**
   * التاء المربوطة: ة → ه
   */
  normalizeTaaMarbuta(text: string): string {
    return text.replace(/ة/g, 'ه');
  }

  /**
   * إزالة كل التشكيل: الفتحة، الضمة، الكسرة، الشدة، السكون، التنوين
   */
  removeTashkeel(text: string): string {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  }

  /**
   * إزالة الكشيدة (التطويل)
   */
  removeTatweel(text: string): string {
    return text.replace(/\u0640/g, '');
  }

  /**
   * إزالة المسافات الزائدة
   */
  removeSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * إزالة "ال" التعريف من بداية الكلمة
   */
  removeAlTaarif(text: string): string {
    return text.split(' ').map(word => {
      if (word.startsWith('ال') && word.length > 3) {
        return word.substring(2);
      }
      return word;
    }).join(' ');
  }

  /**
   * معالجة الحروف المكررة المتجاورة (محمممد → محمد)
   */
  collapseDuplicates(text: string): string {
    return text.replace(/(.)\1{2,}/g, '$1');
  }

  /**
   * التحقق من أن النص عربي بالكامل
   */
  isArabic(text: string): boolean {
    const arabicPattern = /^[\u0600-\u06FF\s]+$/;
    return arabicPattern.test(text.trim());
  }

  /**
   * إرجاع الحروف العربية فقط
   */
  extractArabicLetters(text: string): string[] {
    return text.split('').filter(char => /[\u0600-\u06FF]/.test(char));
  }

  /**
   * مقارنة تطبيعية بين نصين
   */
  areEquivalent(text1: string, text2: string): boolean {
    return this.normalize(text1) === this.normalize(text2);
  }
}

// نسخة Singleton جاهزة
export const arabicNormalizer = new ArabicNormalizer();
