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

export function routeAssistantText(text: string): AssistantRoute {
  const name = extractNameForAnalysis(text);
  if (!name) {
    return { decision: 'kb' };
  }
  return {
    decision: 'hybrid',
    name,
    mode: detectMode(text),
  };
}
