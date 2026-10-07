import { PolicyCategory, PolicyDecision, PolicyResult, PolicyRule } from './types';
import { MEDICAL_RULES } from './policies/medical';
import { RELIGIOUS_RULES } from './policies/religious';
import { LEGAL_RULES } from './policies/legal';
import { FINANCIAL_RULES } from './policies/financial';
import { PRIVACY_RULES } from './policies/privacy';
import { SELF_HARM_RULES } from './policies/selfHarm';

// ═══════════════════════════════════════════════════════════
// أولوية القرارات — الأعلى يفوز عند التعارض
// ═══════════════════════════════════════════════════════════
const DECISION_PRIORITY: Record<PolicyDecision, number> = {
  ALLOW: 0,
  WARN: 1,
  TRANSFORM: 2,
  ABSTAIN: 3,
  ESCALATE: 4,
  BLOCK: 5,
};

class PolicyEngine {
  private rules: PolicyRule[];

  constructor() {
    this.rules = [
      ...SELF_HARM_RULES,   // الأولوية القصوى
      ...PRIVACY_RULES,
      ...MEDICAL_RULES,
      ...LEGAL_RULES,
      ...FINANCIAL_RULES,
      ...RELIGIOUS_RULES,
    ];
  }

  /**
   * evaluateInput — يفحص نصاً ويعيد أقوى قرار ينطبق عليه
   */
  evaluateInput(text: string): PolicyResult {
    const empty: PolicyResult = { decision: 'ALLOW', category: null, reason: '' };
    if (!text || text.trim().length === 0) return empty;

    let strongest: PolicyResult = empty;
    let strongestPriority = 0;

    for (const rule of this.rules) {
      const match = text.match(rule.pattern);
      if (!match) continue;

      const priority = DECISION_PRIORITY[rule.decision];
      if (priority > strongestPriority) {
        strongestPriority = priority;
        strongest = {
          decision: rule.decision,
          category: rule.category,
          reason: rule.reason,
          matchedPattern: match[0],
          transform: rule.transform ? rule.transform(match[0]) : undefined,
        };
      }
    }

    return strongest;
  }

  /**
   * applyTransform — يطبّق التحويل على النص
   */
  applyTransform(text: string, result: PolicyResult): string {
    if (result.decision !== 'TRANSFORM') return text;
    if (!result.transform || !result.matchedPattern) return text;
    return text.replace(result.matchedPattern, result.transform);
  }

  isBlocked(result: PolicyResult): boolean {
    return result.decision === 'BLOCK' || result.decision === 'ESCALATE';
  }

  shouldAbstain(result: PolicyResult): boolean {
    return result.decision === 'ABSTAIN';
  }

  shouldWarn(result: PolicyResult): boolean {
    return result.decision === 'WARN';
  }

  stats(): { total: number; byCategory: Record<string, number>; byDecision: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    const byDecision: Record<string, number> = {};
    for (const r of this.rules) {
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      byDecision[r.decision] = (byDecision[r.decision] ?? 0) + 1;
    }
    return { total: this.rules.length, byCategory, byDecision };
  }

  listCategories(): PolicyCategory[] {
    const set = new Set<PolicyCategory>();
    for (const r of this.rules) set.add(r.category);
    return Array.from(set);
  }

  /** للاختبار */
  listRules(): PolicyRule[] {
    return [...this.rules];
  }
}

export const policyEngine = new PolicyEngine();
