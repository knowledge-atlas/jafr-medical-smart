// ================================================================
// أنواع طبقة الذكاء الاصطناعي
// ================================================================

import { KnowledgeEntity, SearchResult } from '../kb/types';

// نية السؤال
export type Intent =
  | 'entity_lookup'      // "ما هو الجذر 2؟"
  | 'analytical'         // "حلل شخصية أحمد"
  | 'therapeutic'        // "كيف أتعامل مع ظل الجذر 3؟"
  | 'comparative'        // "قارن بين الجذر 1 و 2"
  | 'medical'            // "ما هي أعراض خلل الجذر 5؟"
  | 'general';           // "ما هو الجفر؟"

// نتيجة تصنيف النية
export interface IntentResult {
  intent: Intent;
  confidence: number;             // 0-1
  entities: string[];             // الكيانات المستخرجة ("الجذر 2", "الشمس")
  keywords: string[];             // كلمات مفتاحية
  medical: boolean;               // هل يشمل طب؟
}

// مصدر معلومة في الإجابة
export interface Source {
  type: 'internal' | 'external';
  entityId?: string;
  entityTitle?: string;
  sourceFile?: string;
  sha256?: string;
  url?: string;
  confidence: number;
  snippet: string;
}

// نتيجة AI كاملة
export interface AIResponse {
  question: string;
  intent: Intent;
  answer: string;                 // الإجابة النهائية
  sources: Source[];              // المصادر المستخدمة
  confidence: number;             // ثقة الإجابة
  offline: boolean;               // هل تم بدون إنترنت؟
  generatedAt: string;
  suggestions?: string[];         // أسئلة مقترحة إضافية
}

// إعدادات LLM (اختياري)
export interface LLMConfig {
  enabled: boolean;
  provider: 'gemini' | 'openai' | 'anthropic' | 'local';
  apiKey?: string;                // يُخزن في SecureStore، ليس هنا
  model?: string;
  maxTokens?: number;
}

// سياق يبنى من KB قبل الإرسال لـ LLM
export interface AIContext {
  question: string;
  intent: Intent;
  entities: KnowledgeEntity[];
  relations: any[];
  externalSources: Source[];
}
