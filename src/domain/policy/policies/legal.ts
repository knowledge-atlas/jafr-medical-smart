import { PolicyRule } from '../types';

export const LEGAL_RULES: PolicyRule[] = [
  {
    id: 'leg-001',
    category: 'legal',
    pattern: /(قضية|محكمة|دعوى).{0,15}(سأربح|سأخسر|سينجح|سيفشل)|(سأربح|سأخسر|سينجح|سيفشل).{0,15}(قضية|محكمة|دعوى)/i,
    decision: 'ABSTAIN',
    reason: 'لا يقدم النظام توقعات قانونية',
  },
  {
    id: 'leg-002',
    category: 'legal',
    pattern: /(هل سأُسجن|هل سأُحاكم|هل سأُدان)/i,
    decision: 'ABSTAIN',
    reason: 'لا يقدم النظام توقعات قانونية',
  },
];
