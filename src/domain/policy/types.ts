// ═══════════════════════════════════════════════════════════
// Policy Engine — 6 قرارات صريحة لكل مدخل
// ═══════════════════════════════════════════════════════════

/**
 * القرارات الستة:
 * ALLOW     — يُسمح كاملاً
 * WARN      — يُسمح مع تحذير
 * TRANSFORM — يُحوّل النص (تعليق)
 * ABSTAIN   — يمتنع النظام عن الإجابة
 * ESCALATE  — يصعّد لمتخصص (إشارة خطر)
 * BLOCK     — يُمنع كلياً
 */
export type PolicyDecision =
  | 'ALLOW'
  | 'WARN'
  | 'TRANSFORM'
  | 'ABSTAIN'
  | 'ESCALATE'
  | 'BLOCK';

export type PolicyCategory =
  | 'medical'
  | 'religious'
  | 'legal'
  | 'financial'
  | 'privacy'
  | 'self_harm';

export interface PolicyResult {
  decision: PolicyDecision;
  category: PolicyCategory | null;
  reason: string;
  matchedPattern?: string;
  transform?: string;
}

export interface PolicyRule {
  id: string;
  category: PolicyCategory;
  pattern: RegExp;
  decision: PolicyDecision;
  reason: string;
  transform?: (match: string) => string;
}
