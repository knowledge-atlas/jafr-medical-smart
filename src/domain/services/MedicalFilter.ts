/**
 * MedicalFilter — يحمي التقرير من الادعاءات الطبية الخطرة
 * - يحذف الجرعات الدوائية (mg)
 * - يعيد تسمية "الدواء الأساسي" → "الارتباط الدوائي الرمزي (للمختصين فقط)"
 * - يحذف أسماء الأدوية الكيميائية
 * - يُبقي: المكملات الغذائية + العلاج الحركي + نصائح نمط الحياة
 */

export interface FilterResult {
  text: string;
  removedItems: string[];
  applied: boolean;
}

const REMOVAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // الجرعات: 50-200 mg، 10 mg، ملغ
  { pattern: /\d+\s*-\s*\d+\s*(?:mg|ملغ|مليغرام)/gi, label: 'جرعة دوائية (نطاق)' },
  { pattern: /\d+(?:\.\d+)?\s*(?:mg|ملغ|مليغرام)/gi, label: 'جرعة دوائية (مفردة)' },
  { pattern: /(?:جرعة|الجرعة)[:：]\s*[^\n]+/gi, label: 'سطر الجرعة' },

  // أسماء الأدوية الكيميائية (SSRIs / SNRIs)
  { pattern: /\bSSRIs?\b|\bSNRIs?\b/gi, label: 'اسم فئة دوائية' },
  { pattern: /Sertraline|Escitalopram|Fluoxetine|Venlafaxine|Duloxetine|Paroxetine|Citalopram|Fluvoxamine/gi, label: 'اسم دواء كيميائي' },
  { pattern: /سيرترالين|إسيتالوبرام|فلوكسيتين|فينلافاكسين|دولوكسيتين|باروكسيتين|سيتالوبرام/gi, label: 'اسم دواء بالعربية' },

  // الناقلات العصبية كأسماء أدوية (يمكن الإبقاء عليها كوصف)
  // لكن لا نُبقيها كـ "توصية دوائية"
];

const RENAME_MAP: Array<{ from: RegExp; to: string }> = [
  // إعادة تسمية الدواء إلى "ارتباط رمزي"
  { from: /الدواء الأساسي/gi, to: 'الارتباط الدوائي الرمزي (للمختصين فقط)' },
  { from: /الدواء البديل/gi, to: 'ارتباط رمزي بديل (للمختصين فقط)' },

  // إبقاء المكملات (آمنة)
  { from: /المكمل[:：]/gi, to: '💊 المكملات الآمنة (استشر طبيبك):' },

  // إبقاء العلاج النفسي والحَرَكي (آمن)
  { from: /العلاج النفسي[:：]/gi, to: '🧠 العلاج النفسي (عام):' },
  { from: /العلاج الحركي[:：]/gi, to: '🏃 العلاج الحركي:' },

  // إبقاء الغذاء والنوم (آمن)
  { from: /الغذاء[:：]/gi, to: '🥗 الغذاء:' },
  { from: /النوم[:：]/gi, to: '😴 النوم:' },
  { from: /الرياضة[:：]/gi, to: '⚽ الرياضة:' },
];

const SAFE_MEDICAL_NOTICE = `

> ⚠️ **ملاحظة قانونية وأخلاقية مهمة:**
> لا يمكن استنتاج النواقل العصبية أو الهرمونات أو الأعضاء أو الأدوية المناسبة من الاسم أو الجفر.
> كل ما ورد أعلاه هو **ارتباطات رمزية** لأغراض معرفية فقط — وليس تشخيصاً طبياً.
> أي أعراض نفسية أو جسدية مستمرة **ينبغي تقييمها مع طبيب أو مختص نفسي مؤهل**.
`;

export class MedicalFilter {
  filter(text: string): FilterResult {
    if (!text) return { text, removedItems: [], applied: false };

    const removedItems: string[] = [];
    let filtered = text;

    // 1) حذف الجرعات والأدوية
    for (const rule of REMOVAL_PATTERNS) {
      const matches = filtered.match(rule.pattern);
      if (matches && matches.length > 0) {
        removedItems.push(`${rule.label} (${matches.length})`);
        filtered = filtered.replace(rule.pattern, '— محذوف حمايةً للمستخدم —');
      }
    }

    // 2) إعادة التسمية الآمنة
    for (const rule of RENAME_MAP) {
      filtered = filtered.replace(rule.from, rule.to);
    }

    // 3) إضافة تنبيه طبي في نهاية القسم
    const hasMedicalSection = /الموسوعة الطبية|الطب التكاملي|الناقل العصبي|الغدة/.test(filtered);
    if (hasMedicalSection && !filtered.includes('ملاحظة قانونية وأخلاقية')) {
      filtered += SAFE_MEDICAL_NOTICE;
    }

    return {
      text: filtered,
      removedItems: Array.from(new Set(removedItems)),
      applied: removedItems.length > 0,
    };
  }
}

export const medicalFilter = new MedicalFilter();
