// ================================================================
// جسر LLM — اتصال اختياري بـ Gemini أو OpenAI + Demo Mode
// ================================================================

import * as SecureStore from 'expo-secure-store';
import { AIContext, LLMConfig } from './types';

const GEMINI_KEY_STORAGE = 'gemini_api_key';
const OPENAI_KEY_STORAGE = 'openai_api_key';
const PROVIDER_STORAGE = 'llm_provider';

export class LLMBridge {
  /**
   * حفظ مفتاح API بشكل آمن
   */
  async saveApiKey(provider: 'gemini' | 'openai', apiKey: string): Promise<void> {
    const key = provider === 'gemini' ? GEMINI_KEY_STORAGE : OPENAI_KEY_STORAGE;
    await SecureStore.setItemAsync(key, apiKey);
  }

  async getApiKey(provider: 'gemini' | 'openai'): Promise<string | null> {
    const key = provider === 'gemini' ? GEMINI_KEY_STORAGE : OPENAI_KEY_STORAGE;
    return await SecureStore.getItemAsync(key);
  }

  async deleteApiKey(provider: 'gemini' | 'openai'): Promise<void> {
    const key = provider === 'gemini' ? GEMINI_KEY_STORAGE : OPENAI_KEY_STORAGE;
    await SecureStore.deleteItemAsync(key);
  }

  async setProvider(provider: 'gemini' | 'openai' | 'demo' | 'none'): Promise<void> {
    await SecureStore.setItemAsync(PROVIDER_STORAGE, provider);
  }

  async getProvider(): Promise<'gemini' | 'openai' | 'demo' | 'none'> {
    const p = await SecureStore.getItemAsync(PROVIDER_STORAGE);
    return (p as any) || 'none';
  }

  /**
   * التوليد الرئيسي — يستخدم LLM إذا كان مفعّلاً، أو Demo Mode
   */
  async generate(
    context: AIContext,
    contextText: string,
    intent: string
  ): Promise<{ answer: string; tokensUsed?: number } | null> {
    const provider = await this.getProvider();

    // Demo Mode
    if (provider === 'demo') {
      return this.generateDemo(context, intent);
    }

    if (provider === 'none') return null;

    const apiKey = await this.getApiKey(provider as 'gemini' | 'openai');
    if (!apiKey) return null;

    const systemPrompt = this.buildSystemPrompt(intent);
    const userPrompt = `السؤال: ${context.question}\n\n${contextText}\n\nيرجى الإجابة بالاعتماد على السياق أعلاه حصراً.`;

    try {
      if (provider === 'gemini') {
        return await this.callGemini(apiKey, systemPrompt, userPrompt);
      }
      if (provider === 'openai') {
        return await this.callOpenAI(apiKey, systemPrompt, userPrompt);
      }
    } catch (error: any) {
      console.error('❌ فشل LLM:', error.message);
      return null;
    }

    return null;
  }

  /**
   * الوضع التجريبي — إجابات مبنية على السياق
   */
  private async generateDemo(context: AIContext, intent: string): Promise<{ answer: string; tokensUsed?: number }> {
    await new Promise(r => setTimeout(r, 600));

    const parts: string[] = [];
    parts.push('🤖 **[الوضع التجريبي]** — عرض توضيحي لشكل إجابة AI الحقيقي.\n');

    if (context.entities.length === 0) {
      return { answer: parts.join('\n') + '\n⚠️ لم أجد معلومات في قاعدة المعرفة لهذا السؤال.', tokensUsed: 0 };
    }

    parts.push(`📌 **السؤال:** ${context.question}`);
    parts.push(`🎯 **النوع المُكتشف:** ${this.intentLabel(intent)}`);
    parts.push(`📚 **المصادر المتاحة:** ${context.entities.length} مصدر داخلي`);
    parts.push(`🔗 **العلاقات ذات الصلة:** ${context.relations.length}\n`);

    parts.push(`**──── الإجابة الموجزة ────**`);
    const top = context.entities[0];
    const firstLines = top.fullText.split('\n').slice(0, 8).join('\n');
    parts.push(firstLines);

    if (context.entities.length > 1) {
      parts.push(`\n\n**──── مصادر إضافية ────**`);
      context.entities.slice(1, 3).forEach((e, i) => {
        parts.push(`\n◈ [${i + 2}] ${e.titleAr}: ${e.fullText.substring(0, 100)}...`);
      });
    }

    parts.push(`\n\n**──── ملاحظة ────**`);
    parts.push('هذا رد تجريبي. لتفعيل الذكاء الاصطناعي الحقيقي:');
    parts.push('1. احصل على مفتاح Gemini مجاني من:');
    parts.push('   https://aistudio.google.com/app/apikey');
    parts.push('2. الصقه في: الإعدادات ← Gemini ← حفظ وتفعيل.');
    parts.push('3. ستحصل على إجابات ذكية حقيقية مبنية على نفس البيانات.');

    return { answer: parts.join('\n'), tokensUsed: 0 };
  }

  // ═══════════════════════════════════════════════════════════
  // Gemini API
  // ═══════════════════════════════════════════════════════════
  private async callGemini(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ answer: string; tokensUsed?: number }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        topP: 0.9,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini ${res.status}: ${txt.substring(0, 200)}`);
    }

    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = data?.usageMetadata?.totalTokenCount;

    return { answer: answer.trim(), tokensUsed: tokens };
  }

  // ═══════════════════════════════════════════════════════════
  // OpenAI API
  // ═══════════════════════════════════════════════════════════
  private async callOpenAI(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ answer: string; tokensUsed?: number }> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI ${res.status}: ${txt.substring(0, 200)}`);
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content || '';
    const tokens = data?.usage?.total_tokens;

    return { answer: answer.trim(), tokensUsed: tokens };
  }

  // ═══════════════════════════════════════════════════════════
  // System Prompt
  // ═══════════════════════════════════════════════════════════
  private buildSystemPrompt(intent: string): string {
    return `أنت مساعد ذكي متخصص في علم الجفر وعلم النفس البنيوي والطب التكاملي.

قواعد صارمة:
1. أجب بالاعتماد على السياق المُرفق حصراً (لا تخترع معلومات).
2. إذا لم يكن السياق كافياً، قل صراحة: "المعلومات المتاحة غير كافية".
3. حافظ على النص الأصلي عند الاقتباس — لا تغيّر الألفاظ.
4. إذا كان السؤال طبياً، أضف تحذيراً: "هذه المعلومات لا تُغني عن استشارة طبيب".
5. لا تخلط بين المصادر الداخلية والخارجية في نفس الفقرة.
6. اكتب بالعربية الفصحى، بإيجاز ووضوح.

نوع السؤال: ${intent}`;
  }

  private intentLabel(intent: string): string {
    const labels: Record<string, string> = {
      analytical: '🔍 تحليل',
      therapeutic: '💊 علاج',
      medical: '🏥 تحليل طبي',
      comparative: '⚖️ مقارنة',
      entity_lookup: '📖 استعلام',
      general: '💬 سؤال عام',
    };
    return labels[intent] || '📖 استعلام';
  }

  /**
   * اختبار الاتصال بـ LLM
   */
  async testConnection(provider: 'gemini' | 'openai'): Promise<{ ok: boolean; message: string }> {
    const apiKey = await this.getApiKey(provider);
    if (!apiKey) {
      return { ok: false, message: 'لا يوجد مفتاح API محفوظ' };
    }

    try {
      const testPrompt = 'قل: "اتصال ناجح" فقط.';
      if (provider === 'gemini') {
        await this.callGemini(apiKey, 'أنت مساعد.', testPrompt);
      } else {
        await this.callOpenAI(apiKey, 'أنت مساعد.', testPrompt);
      }
      return { ok: true, message: 'الاتصال يعمل ✅' };
    } catch (error: any) {
      return { ok: false, message: error.message };
    }
  }
}

export const llmBridge = new LLMBridge();
