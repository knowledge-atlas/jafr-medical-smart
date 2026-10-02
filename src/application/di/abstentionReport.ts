import { AbstentionResult, AbstentionReason } from '../../domain/services/AbstentionProtocol';

const REASON_LABELS: Record<AbstentionReason, string> = {
  LOW_CONFIDENCE: 'درجة ثقة منخفضة',
  RADICAL_CONFLICT: 'تعارض جذري بين الطبقات',
  NON_ARABIC_NAME: 'اسم غير عربي',
  UNKNOWN_CHARACTERS: 'حروف أو رموز غير معروفة',
  FEEDBACK_CONTRADICTION: 'تناقض مع تغذية راجعة سابقة',
};

export function buildAbstentionReport(abstention: AbstentionResult): string {
  const lines: string[] = [];
  lines.push('# تقرير امتناع');
  lines.push('');
  lines.push('النظام امتنع عن تقديم تحليل كامل للأسباب التالية:');
  lines.push('');
  abstention.reasons.forEach((reason, idx) => {
    const label = REASON_LABELS[reason] ?? reason;
    const message = abstention.messages[idx] ?? '';
    lines.push(`${idx + 1}. **${label}** — ${message}`);
  });
  lines.push('');
  lines.push('## التوصية');
  lines.push('');
  lines.push('يُرجى مراجعة المدخلات والمحاولة مرة أخرى، أو استشارة مختص.');
  return lines.join('\n');
}
