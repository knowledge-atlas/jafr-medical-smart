import { PolicyRule } from '../types';

export const PRIVACY_RULES: PolicyRule[] = [
  {
    id: 'prv-001',
    category: 'privacy',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    decision: 'BLOCK',
    reason: 'لا تُدخل أرقام بطاقات بنكية',
  },
  {
    id: 'prv-002',
    category: 'privacy',
    pattern: /(رقم الهوية|رقم البطاقة|الرقم القومي|SSN)/i,
    decision: 'BLOCK',
    reason: 'لا تُدخل أرقام هوية حساسة',
  },
  {
    id: 'prv-003',
    category: 'privacy',
    pattern: /(كلمة المرور|كلمة السر|password|رمز التحقق|OTP)/i,
    decision: 'BLOCK',
    reason: 'لا تُدخل كلمات مرور أو رموز تحقق',
  },
];
