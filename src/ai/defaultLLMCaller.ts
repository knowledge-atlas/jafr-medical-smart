import * as SecureStore from 'expo-secure-store';
import { LLMCaller, LLMCallResult } from './LLMCaller';

const GEMINI_KEY = 'gemini_api_key';
const OPENAI_KEY = 'openai_api_key';
const PROVIDER = 'llm_provider';

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-flash-latest',
  'gemini-1.5-flash-002',
];

const GROQ_MODELS = [
  'qwen/qwen3-32b',
  'moonshotai/kimi-k2-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'openai/gpt-oss-120b',
  'gemma2-9b-it',
];

const OPENROUTER_MODELS = [
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen3-32b:free',
  'deepseek/deepseek-r1-0528:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

export type LLMProvider = 'gemini' | 'openai' | 'demo' | 'none';

export class DefaultLLMCaller implements LLMCaller {
  async generate(systemPrompt: string, userPrompt: string): Promise<LLMCallResult> {
    const provider = ((await SecureStore.getItemAsync(PROVIDER)) ?? 'none') as LLMProvider;

    if (provider === 'none') {
      return { answer: '⚠️ لم يتم تفعيل الذكاء الاصطناعي. افتح الإعدادات وأضف مفتاحاً.', tokensUsed: 0 };
    }
    if (provider === 'demo') {
      return { answer: `🤖 **[وضع تجريبي]**\n\nاستلمت: "${userPrompt.slice(0, 100)}"`, tokensUsed: 0 };
    }

    if (provider === 'gemini') {
      const apiKey = await SecureStore.getItemAsync(GEMINI_KEY);
      if (!apiKey) return { answer: '⚠️ مفتاح Gemini مفقود.', tokensUsed: 0 };
      return this.callGemini(apiKey, systemPrompt, userPrompt);
    }

    const apiKey = await SecureStore.getItemAsync(OPENAI_KEY);
    if (!apiKey) return { answer: '⚠️ المفتاح مفقود.', tokensUsed: 0 };
    return this.callOpenAICompatible(apiKey, systemPrompt, userPrompt);
  }

  private async callGemini(apiKey: string, system: string, user: string): Promise<LLMCallResult> {
    const body = {
      system_instruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 2048, topP: 0.9 },
    };

    let lastError = '';
    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          lastError = `${model}: ${(await res.text()).slice(0, 120)}`;
          continue;
        }
        const data: any = await res.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!answer) { lastError = `${model}: empty`; continue; }
        console.log(`✅ Gemini (${model}) — ${data?.usageMetadata?.totalTokenCount ?? 0} token`);
        return { answer: answer.trim(), tokensUsed: data?.usageMetadata?.totalTokenCount ?? 0 };
      } catch (e: any) {
        lastError = `${model}: ${e?.message ?? 'network'}`;
      }
    }
    throw new Error(`Gemini: ${lastError}`);
  }

  private async callOpenAICompatible(apiKey: string, system: string, user: string): Promise<LLMCallResult> {
    let url = 'https://api.openai.com/v1/chat/completions';
    let models = OPENAI_MODELS;
    let name = 'OpenAI';

    if (apiKey.startsWith('gsk_')) {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      models = GROQ_MODELS;
      name = 'Groq';
    } else if (apiKey.startsWith('sk-or-v1-')) {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      models = OPENROUTER_MODELS;
      name = 'OpenRouter';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
    if (name === 'OpenRouter') {
      headers['HTTP-Referer'] = 'https://knowledgeatlas.app';
      headers['X-Title'] = 'KnowledgeAtlas Sovereign';
    }

    let lastError = '';
    for (const model of models) {
      try {
        const body = {
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.5,
          max_tokens: 2048,
        };
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          lastError = `${model}: ${(await res.text()).slice(0, 120)}`;
          continue;
        }
        const data: any = await res.json();
        const answer = data?.choices?.[0]?.message?.content || '';
        if (!answer) { lastError = `${model}: empty`; continue; }
        console.log(`✅ ${name} (${model}) — ${data?.usage?.total_tokens ?? 0} token`);
        return { answer: answer.trim(), tokensUsed: data?.usage?.total_tokens ?? 0 };
      } catch (e: any) {
        lastError = `${model}: ${e?.message ?? 'network'}`;
      }
    }
    throw new Error(`${name}: ${lastError}`);
  }
}

export const defaultLLMCaller = new DefaultLLMCaller();
