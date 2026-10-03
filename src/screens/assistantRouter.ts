import { ContextMode } from '../ai/ContextAwarePrompter';
import { extractNameForAnalysis } from '../ai/utils/extractName';

export type AssistantDecision = 'hybrid' | 'kb';

export interface AssistantRoute {
  decision: AssistantDecision;
  name?: string;
  mode?: ContextMode;
}

function detectMode(text: string): ContextMode {
  if (/(زواج|زوج|شريك|شريكة|خطيب|خطيبة|توافق)/.test(text)) return 'marital';
  if (/(عمل|مهني|مهنة|وظيفة|مسيرة|مسار|وظيفي)/.test(text)) return 'professional';
  if (/(مشروع|تجاري|شركة|براند|علامة|بزنس|منتج)/.test(text)) return 'commercial';
  return 'personal';
}

/**
 * يوجّه النص إلى:
 * - hybrid: يستخدم HybridEngine (LLM + KB)
 * - kb: البحث المحلي فقط (احتياطي)
 *
 * @param text سؤال المستخدم
 * @param hasLLM هل LLM مفعّل؟ إذا نعم، كل الأسئلة → hybrid
 */
export function routeAssistantText(
  text: string,
  hasLLM: boolean = false
): AssistantRoute {
  const name = extractNameForAnalysis(text);
  const mode = detectMode(text);

  // إذا LLM مفعّل — كل الأسئلة تمرّ عبر HybridEngine
  if (hasLLM) {
    return { decision: 'hybrid', name: name ?? undefined, mode };
  }

  // بدون LLM: أسئلة الكيانات فقط عبر KB
  if (!name) {
    return { decision: 'kb' };
  }
  return { decision: 'hybrid', name, mode };
}
