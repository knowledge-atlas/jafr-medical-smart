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
    const MODELS = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-flash-latest',
      'gemini-1.5-flash-002',
    ];

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        topP: 0.9,
      },
    };

    let lastError = '';

    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const txt = await res.text();
          lastError = `${model} → ${res.status}: ${txt.substring(0, 200)}`;
          console.warn('⚠️ فشل Gemini:', lastError);
          continue;
        }

        const data = await res.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const tokens = data?.usageMetadata?.totalTokenCount;
        console.log(`✅ Gemini (${model}) نجح`);
        return { answer: answer.trim(), tokensUsed: tokens };
      } catch (e: any) {
        lastError = `${model} → ${e?.message ?? 'network'}`;
        console.warn('⚠️ خطأ شبكة:', lastError);
      }
    }

    throw new Error(`كل الموديلات فشلت. آخر خطأ: ${lastError}`);
  }

  // ═══════════════════════════════════════════════════════════
  // OpenAI API
  // ═══════════════════════════════════════════════════════════
  private async callOpenAI(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ answer: string; tokensUsed?: number }> {
    let isGroq = false;
    let isOpenRouter = false;
    let providerName = 'OpenAI';

    if (apiKey.startsWith('gsk_')) {
      isGroq = true;
      providerName = 'Groq';
    } else if (apiKey.startsWith('sk-or-v1-')) {
      isOpenRouter = true;
      providerName = 'OpenRouter';
    }

    // قوائم الموديلات لكل مزود
    const MODELS = isOpenRouter
      ? [
          'google/gemma-3-27b-it:free',
          'meta-llama/llama-3.1-8b-instruct:free',
          'qwen/qwen3-32b:free',
          'deepseek/deepseek-r1-0528:free',
          'nvidia/nemotron-3-super-120b-a12b:free',
        ]
      : isGroq
      ? [
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'qwen/qwen3-32b',
          'gemma2-9b-it',
          'llama-3.1-8b-instant',
        ]
      : ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

    const url = isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    let lastError = '';

    for (const model of MODELS) {
      try {
        console.log(`🔌 ${providerName}: تجربة ${model}`);

        const body = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };

        if (isOpenRouter) {
          headers['HTTP-Referer'] = 'https://knowledgeatlas.app';
          headers['X-Title'] = 'KnowledgeAtlas Sovereign';
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const txt = await res.text();
          lastError = `${model} → ${res.status}: ${txt.substring(0, 150)}`;
          console.warn(`⚠️ ${providerName} فشل:`, lastError);
          continue;
        }

        const data: any = await res.json();
        const answer = data?.choices?.[0]?.message?.content || '';
        const tokens = data?.usage?.total_tokens;

        if (!answer) {
          lastError = `${model} → رد فارغ`;
          continue;
        }

        console.log(`✅ ${providerName} (${model}) نجح — ${tokens} token`);
        return { answer: answer.trim(), tokensUsed: tokens };
      } catch (e: any) {
        lastError = `${model} → ${e?.message ?? 'network'}`;
        console.warn('⚠️ خطأ:', lastError);
      }
    }

    throw new Error(`كل الموديلات فشلت. آخر خطأ: ${lastError}`);
  }

  private buildSystemPrompt(intent: string): string {
    const base = `أنت مساعد ذكي في نظام الجفر الطبي الذكي (KnowledgeAtlas Sovereign).
تخصصك: تحليل الأسماء وفق علوم الجفر والحروف والأبراج والطب التكاملي.
لديك قاعدة معرفة شاملة: 9 جذور، 10 كواكب، 12 برجاً، 12 بيتاً، 4 طبائع، 28 حرفاً.
التزم بالأخلاقيات: لا وعظ ديني، لا تشخيص طبي، لا تنبؤات قاطعة.`;

    const intentHint: Record<string, string> = {
      analytical: 'قدّم تحليلاً منهجياً منظماً.',
      entity_lookup: 'أجب بتركيز على الكيان المطلوب.',
      comparative: 'قدّم مقارنة واضحة بين الطرفين.',
      therapeutic: 'قدّم توصيات عملية قابلة للتطبيق.',
      medical: 'أشر إلى أن التحليل نمطي، ووجّه للطبيب عند الحاجة.',
      general: 'أجب بشكل عام ومبسط.',
    };

    return base + '\n\n' + (intentHint[intent] ?? '');
  }

  private intentLabel(intent: string): string {
    const labels: Record<string, string> = {
      analytical: 'تحليل شخصية',
      entity_lookup: 'بحث عن كيان',
      comparative: 'مقارنة',
      therapeutic: 'توصية علاجية',
      medical: 'استفسار طبي',
      general: 'سؤال عام',
    };
    return labels[intent] ?? 'عام';
  }

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
