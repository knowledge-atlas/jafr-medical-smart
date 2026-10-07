import { PolicyRule } from '../types';

export const SELF_HARM_RULES: PolicyRule[] = [
  {
    id: 'sh-001',
    category: 'self_harm',
    pattern: /(انتحار|أقتل نفسي|أنهي حياتي|أنتحر|أريد أن أموت|أتمنى الموت)/i,
    decision: 'ESCALATE',
    reason: 'إشارة خطر — توجّه فوراً لمساعدة نفسية متخصصة',
  },
  {
    id: 'sh-002',
    category: 'self_harm',
    pattern: /(أجرح نفسي|أؤذي نفسي|إيذاء الذات|أتأذى)/i,
    decision: 'ESCALATE',
    reason: 'إشارة خطر — توجّه فوراً لمساعدة نفسية متخصصة',
  },
];
