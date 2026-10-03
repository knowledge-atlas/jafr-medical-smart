export interface BrandHint {
  description: string;
  high: string;
  medium: string;
  low: string;
  recHigh: string;
  recMedium: string;
  recLow: string;
}

export const BRAND_HINTS: Record<string, BrandHint> = {
  pronunciation: {
    description: 'سهولة النطق — يقيس مدى سلاسة الاسم على اللسان العربي.',
    high: 'الاسم سهل النطق جداً — سينتشر بسرعة شفهياً.',
    medium: 'الاسم مقبول النطق — قد يحتاج توضيحاً في بعض الأحيان.',
    low: 'الاسم صعب النطق — قد يُنسى أو يُحرف.',
    recHigh: 'استخدم النطق السلس في الإعلانات الشفهية.',
    recMedium: 'أضف نطقاً توضيحياً في المواد التسويقية.',
    recLow: 'فكّر في تخفيف الحروف الثقيلة أو إضافة حركات.',
  },
  memorability: {
    description: 'قابلية الحفظ — يقيس مدى سهولة تذكّر الاسم.',
    high: 'الاسم قصير ومميز — يُحفظ بسرعة.',
    medium: 'الاسم بطول متوسط — يُحفظ مع التكرار.',
    low: 'الاسم طويل — قد يُنسى بسهولة.',
    recHigh: 'استثمر القِصر في الشعار والنطق.',
    recMedium: 'استخدم تكراراً ذكياً في الإعلانات.',
    recLow: 'فكّر في اختصار أو اختيار اسم أقصر.',
  },
  energy: {
    description: 'الطاقة الطبائعية — يقيس مدى حيوية الاسم.',
    high: 'الطاقة عالية — يوحي بالحيوية والحركة.',
    medium: 'الطاقة متوسطة — يوحي بالتوازن.',
    low: 'الطاقة منخفضة — يوحي بالسكون.',
    recHigh: 'مناسب للعلامات الحركية والتقنية.',
    recMedium: 'مناسب للمنتجات المؤسسية.',
    recLow: 'مناسب للمنتجات التراثية والتقليدية.',
  },
  consistency: {
    description: 'اتساق الطبقات — يقيس ترابط الاسم مع الطبقات الجفرية.',
    high: 'الطبقات متسقة — الاسم متماسك.',
    medium: 'اتساق جزئي — بعض الطبقات غير مترابطة.',
    low: 'الطبقات متفككة — الاسم قد يبدو غير متماسك.',
    recHigh: 'الاسم متماسك — انطلق في التسمية.',
    recMedium: 'راجع الطبقات الناقصة قبل الإطلاق.',
    recLow: 'فكّر في تعديل الاسم لتوحيد الطبقات.',
  },
  differentiation: {
    description: 'التمايز — يقيس مدى تفرد الاسم عن المنافسين.',
    high: 'الاسم مميز — يبرز في السوق.',
    medium: 'الاسم مألوف — يحتاج عنصر تمايز إضافي.',
    low: 'الاسم عام — قد يختلط بالمنافسين.',
    recHigh: 'استثمر التمايز في الهوية البصرية.',
    recMedium: 'أضف شعاراً أو لوناً مميزاً.',
    recLow: 'فكّر في إضافة كلمة مميزة أو إعادة التسمية.',
  },
  fit: {
    description: 'ملاءمة النشاط — يقيس توافق الاسم مع نوع النشاط التجاري.',
    high: 'الاسم يناسب النشاط تماماً — إشارة قوية للجمهور.',
    medium: 'الاسم محايد للنشاط — يمكن أن يعمل.',
    low: 'الاسم قد لا يناسب النشاط — تحدي في التسويق.',
    recHigh: 'استثمر هذه الملاءمة في الرسالة التسويقية.',
    recMedium: 'وضّح العلاقة بين الاسم والنشاط في الإعلانات.',
    recLow: 'فكّر في اسم أكثر ملاءمة للنشاط.',
  },
};

export function describeBrand(
  id: string,
  score: number
): { description: string; interpretation: string; recommendation: string } | null {
  const m = BRAND_HINTS[id];
  if (!m) return null;
  if (score >= 0.7) {
    return { description: m.description, interpretation: m.high, recommendation: m.recHigh };
  }
  if (score >= 0.45) {
    return { description: m.description, interpretation: m.medium, recommendation: m.recMedium };
  }
  return { description: m.description, interpretation: m.low, recommendation: m.recLow };
}
