import { PolicyRule } from '../types';

export const RELIGIOUS_RULES: PolicyRule[] = [
  {
    id: 'rel-001',
    category: 'religious',
    pattern: /(حلال|حرام|فتوى|يجوز|لا يجوز)\s+(شرعاً|دينياً|في الإسلام)/i,
    decision: 'ABSTAIN',
    reason: 'لا يقدم النظام فتاوى شرعية',
  },
  {
    id: 'rel-002',
    category: 'religious',
    pattern: /(الجنة|جهنم|عذاب القبر|يوم القيامة|مصيري في الآخرة)/i,
    decision: 'WARN',
    reason: 'النظام لا يجزم في الغيبيات',
  },
];
