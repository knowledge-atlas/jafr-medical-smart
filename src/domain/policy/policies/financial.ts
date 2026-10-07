import { PolicyRule } from '../types';

export const FINANCIAL_RULES: PolicyRule[] = [
  {
    id: 'fin-001',
    category: 'financial',
    pattern: /(سأربح|سأخسر).{0,15}(مال|أموال|أسهم|عملة|بيتكوين|مليون|ألف)/i,
    decision: 'ABSTAIN',
    reason: 'لا يقدم النظام توقعات مالية',
  },
  {
    id: 'fin-002',
    category: 'financial',
    pattern: /(استثمر|استثمار).{0,10}(أسهم|عملة|بيتكوين|عقار)/i,
    decision: 'WARN',
    reason: 'لا يقدم النظام نصائح استثمارية',
  },
];
