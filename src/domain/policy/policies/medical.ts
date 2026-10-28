// ================================================================
// Medical Policy — BLOCKING ONLY
// يكتشف أسماء الأدوية والجرعات ويحجب الرد (حرس أخلاقي)
// لا يحتوي أي بيانات طبية حقيقية
// ================================================================

export const MEDICAL_RULES: any[] = [
  {
    category: 'medical',
    id: 'medical.drug_name',
    pattern: /Sertraline|Fluoxetine|Escitalopram|Venlafaxine|Duloxetine|Methylphenidate|Amphetamine|Testosterone|Mirtazapine|Lithium|Valproate|Lamotrigine|SSRIs?|SNRIs?/gi,
    decision: 'TRANSFORM',
    message: 'لا أستطيع تقديم معلومات عن الأدوية أو الجرعات.',
  },
  {
    category: 'medical',
    id: 'medical.dose',
    pattern: /\d+\s*-\s*\d+\s*mg|\d+\s*mg|ملغ|جرعة|دواء/gi,
    decision: 'BLOCK',
    message: 'لا أستطيع تقديم معلومات طبية.',
  },
];
