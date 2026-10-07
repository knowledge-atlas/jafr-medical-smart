import { PolicyRule } from '../types';

export const MEDICAL_RULES: PolicyRule[] = [
  {
    id: 'med-001',
    category: 'medical',
    pattern: /\b\d+\s*(mg|ملغ|مغ|جرام|جم|غرام|مل|ml)\b/i,
    decision: 'BLOCK',
    reason: 'لا يقدم النظام جرعات دوائية',
  },
  {
    id: 'med-002',
    category: 'medical',
    pattern: /(اشرب|تناول|استخدم|خذ)\s+(حبوب|دواء|أدوية|حبة|علاج|مضاد)/i,
    decision: 'ABSTAIN',
    reason: 'لا يقدم النظام توجيهات دوائية',
  },
  {
    id: 'med-003',
    category: 'medical',
    pattern: /(Sertraline|SSRIs|Benzodiazepines|Antidepressants|Metformin|Insulin|Xanax|Prozac)/i,
    decision: 'TRANSFORM',
    reason: 'إشارة دوائية — تُعرض كمعلومة عامة فقط',
    transform: (m: string) => `[معلومة عامة — ليست توصية] ${m}`,
  },
  {
    id: 'med-004',
    category: 'medical',
    pattern: /(تشخيص|مصاب بـ|عندي مرض|أنا مريض|هل عندي)/i,
    decision: 'WARN',
    reason: 'النظام لا يقدم تشخيصاً طبياً',
  },
];
