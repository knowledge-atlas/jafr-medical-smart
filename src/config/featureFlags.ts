// ═══════════════════════════════════════════════════════════
// Feature Flags — التحكم في الميزات بدون حذف الكود
// ═══════════════════════════════════════════════════════════

export const FLAGS = {
  /**
   * MEDICAL_MODULE — وحدة الطب التكاملي
   * false: التبويبة مخفية، البيانات كاملة في الكود
   * true: التبويبة تظهر كما هي
   *
   * السبب الحالي: false
   *   - مخاطر Play Store (Health Declaration)
   *   - المخاطر القانونية (medicalTables.ts)
   *   - جاهز للتفعيل بأمر واحد عند التطور
   */
  MEDICAL_MODULE: false,

  /**
   * MEDICAL_TEASER — بطاقة "قريباً" في الرئيسية
   * true: تُعرض بطاقة قائمة الانتظار
   */
  MEDICAL_TEASER: true,

  /**
   * ANALYTICS_REMOTE — إرسال تحليلات للسحابة
   * false: محلي فقط (حالياً)
   */
  ANALYTICS_REMOTE: false,

  /**
   * PAYWALL_ENABLED — شاشة الاشتراكات
   * false: غير مفعّلة (سيُضاف RevenueCat لاحقاً)
   */
  PAYWALL_ENABLED: false,
} as const;

export type FeatureFlag = keyof typeof FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag] === true;
}
