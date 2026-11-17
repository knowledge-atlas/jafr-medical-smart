/**
 * AIIntegration — ربط اختياري (opt-in) بمزود ذكاء اصطناعي مع رجوع تلقائي للمحرك المحلي.
 *
 * المبادئ:
 *  1. المحرك المحلي (ReflectiveArchetypesEngine) هو الأساس دائماً ويعمل دون إنترنت.
 *  2. الذكاء الاصطناعي يضيف «تأملاً إضافياً» فقط ولا يستبدل التحليل ولا يغيّر معناه.
 *  3. لا يُرسَل الاسم ولا أي نص شخصي — فقط عناوين المحاور ومستوياتها (نص غير حساس).
 *  4. المفتاح يُخزَّن في SecureStore على الجهاز (يدخله المستخدم من الإعدادات)،
 *     ولا يُضمَّن في الكود ولا في git. متغير EXPO_PUBLIC_AI_API_KEY للتطوير فقط.
 *  5. أي فشل (شبكة، مهلة، مفتاح خاطئ، حصة) يعيد النتيجة المحلية بصمت.
 *  6. كل نص مولّد يُمرَّر عبر EthicalGuardrails + MedicalFilter ويُرفق به إفصاح.
 */

import * as SecureStore from 'expo-secure-store';
import {
  reflectiveArchetypesEngine,
  ReflectiveProfile,
} from '../domain/services/ReflectiveArchetypesEngine';
import { ethicalGuardrails } from '../ai/EthicalGuardrails';
import { medicalFilter } from '../domain/services/MedicalFilter';
import type { NameAnalysisLayers } from '../application/use-cases/AnalyzeNameUseCase';

// ───────────────────────── ثوابت ─────────────────────────

export const AI_DISCLOSURE = 'هذا المحتوى مولد بالذكاء الاصطناعي';

export const AI_DISCLOSURE_LONG =
  'هذا المحتوى مولد بالذكاء الاصطناعي. هو تأمل رمزي للترفيه والثقافة، وليس تشخيصاً ولا نصيحة طبية أو نفسية أو مالية.';

export type AIProvider = 'gemini' | 'openai';

// نفس مفاتيح LLMBridge / DefaultLLMCaller حتى يبقى كل شيء متوافقاً
const KEY_STORE: Record<AIProvider, string> = {
  gemini: 'gemini_api_key',
  openai: 'openai_api_key',
};
const PROVIDER_STORE = 'llm_provider';
const OPT_IN_STORE = 'ai_opt_in';

const REQUEST_TIMEOUT_MS = 12000;
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-flash-latest'];
const OPENAI_MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = [
  'أنت مساعد تأملي يكتب بالعربية الفصحى المبسطة.',
  'تستلم قائمة محاور (عنوان، مستوى، نسبة) من قراءة رمزية تراثية.',
  'اكتب فقرتين قصيرتين (حتى 150 كلمة) تلخصان الصورة العامة بلغة هادئة ومحفّزة للتأمل.',
  'ممنوع: التشخيص الطبي أو النفسي، ذكر الأدوية أو العلاج، التنبؤ بالمستقبل أو الأجل،',
  'الأحكام القاطعة، أو طلب بيانات شخصية. استخدم عبارات مثل «قد يشير» و«يمكن تأمل».',
  'لا تغيّر أي نسبة أو مستوى مذكور، ولا تضف محاور جديدة.',
].join(' ');

// ───────────────────────── أنواع ─────────────────────────

export interface ReflectionResult {
  /** التقرير المحلي الكامل (دائماً موجود) */
  markdown: string;
  /** التأمل الإضافي المولّد بالذكاء الاصطناعي، أو null إن لم يُستخدم/فشل */
  aiText: string | null;
  source: 'local' | 'ai';
  /** نص الإفصاح — يُعرض عند وجود aiText فقط */
  disclosure: string | null;
  /** سبب الرجوع للمحلي (للتشخيص الداخلي فقط، لا يُعرض للمستخدم كخطأ) */
  fallbackReason?: string;
  profile: ReflectiveProfile;
}

export interface AIStatus {
  enabled: boolean;
  provider: AIProvider | null;
  hasKey: boolean;
}

// ───────────────────────── التخزين ─────────────────────────

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function getProvider(): Promise<AIProvider | null> {
  const p = await safeGet(PROVIDER_STORE);
  return p === 'gemini' || p === 'openai' ? p : null;
}

async function getKey(provider: AIProvider): Promise<string | null> {
  const stored = await safeGet(KEY_STORE[provider]);
  if (stored) return stored;
  // مفتاح تطوير فقط — لا يُعتمد عليه في الإنتاج لأن متغيرات EXPO_PUBLIC تُضمَّن في الحزمة.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const dev = process.env.EXPO_PUBLIC_AI_API_KEY;
    if (dev) return dev;
  }
  return null;
}

// ───────────────────────── إدارة الإعدادات ─────────────────────────

export async function getAIStatus(): Promise<AIStatus> {
  const optIn = (await safeGet(OPT_IN_STORE)) === 'true';
  const provider = await getProvider();
  const hasKey = provider ? !!(await getKey(provider)) : false;
  return { enabled: optIn && hasKey && !!provider, provider, hasKey };
}

export async function setAIEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(OPT_IN_STORE, enabled ? 'true' : 'false');
  if (!enabled) await SecureStore.setItemAsync(PROVIDER_STORE, 'none');
}

export async function setAIProvider(provider: AIProvider): Promise<void> {
  await SecureStore.setItemAsync(PROVIDER_STORE, provider);
}

export async function saveAIKey(provider: AIProvider, rawKey: string): Promise<void> {
  const key = rawKey.trim();
  if (key.length < 20 || /\s/.test(key)) {
    throw new Error('صيغة المفتاح غير صحيحة');
  }
  await SecureStore.setItemAsync(KEY_STORE[provider], key);
  await SecureStore.setItemAsync(PROVIDER_STORE, provider);
}

export async function deleteAIKeys(): Promise<void> {
  for (const p of ['gemini', 'openai'] as AIProvider[]) {
    try {
      await SecureStore.deleteItemAsync(KEY_STORE[p]);
    } catch {
      /* تجاهل */
    }
  }
  try {
    await SecureStore.setItemAsync(PROVIDER_STORE, 'none');
    await SecureStore.setItemAsync(OPT_IN_STORE, 'false');
  } catch {
    /* تجاهل */
  }
}

// ───────────────────────── تجهيز النص غير الحساس ─────────────────────────

/** يبني نصاً مجرداً من المحاور فقط — بلا اسم ولا سرديات. */
export function buildSafePayload(profile: ReflectiveProfile): string {
  return profile.axes
    .map((a) => `${a.index}. ${a.title}: ${a.level} (${Math.round(a.score * 100)}%)`)
    .join('\n');
}

// ───────────────────────── الاتصال الآمن ─────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(key: string, userPrompt: string): Promise<string> {
  let lastStatus = 0;
  for (const model of GEMINI_MODELS) {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
        }),
      },
    );
    lastStatus = res.status;
    if (res.status === 404) continue; // نموذج غير متاح → جرّب التالي
    if (!res.ok) throw new Error(`gemini_http_${res.status}`);
    const data: any = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('gemini_empty');
    return text;
  }
  throw new Error(`gemini_no_model_${lastStatus}`);
}

async function callOpenAI(key: string, userPrompt: string): Promise<string> {
  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`openai_http_${res.status}`);
  const data: any = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('openai_empty');
  return text;
}

/** تنظيف المخرجات: حواجز أخلاقية ثم فلتر المحتوى الطبي. يرجع null إن لم تصلح. */
function sanitizeOutput(raw: string): string | null {
  const guarded = ethicalGuardrails.checkOutput(raw);
  const text = guarded.sanitized ?? raw;
  const filtered = medicalFilter.filter(text);
  // إن حُذف شيء طبي من المخرجات فالأسلم عدم عرضها أصلاً
  if (filtered.applied) return null;
  const clean = filtered.text.trim();
  return clean.length >= 40 ? clean : null;
}

/** اختبار الاتصال من شاشة الإعدادات. */
export async function testAIConnection(): Promise<{ ok: boolean; message: string }> {
  const provider = await getProvider();
  if (!provider) return { ok: false, message: 'اختر المزود واحفظ المفتاح أولاً' };
  const key = await getKey(provider);
  if (!key) return { ok: false, message: 'لا يوجد مفتاح محفوظ' };
  try {
    const probe = 'اكتب كلمة واحدة: جاهز';
    if (provider === 'gemini') await callGemini(key, probe);
    else await callOpenAI(key, probe);
    return { ok: true, message: 'الاتصال يعمل' };
  } catch (e: any) {
    const m = String(e?.message ?? '');
    if (m.endsWith('_401') || m.endsWith('_403')) return { ok: false, message: 'المفتاح مرفوض' };
    if (m.endsWith('_429')) return { ok: false, message: 'تم تجاوز الحد المسموح لدى المزود' };
    return { ok: false, message: 'تعذر الاتصال. تأكد من الإنترنت' };
  }
}

// ───────────────────────── الواجهة الرئيسية ─────────────────────────

export interface AIEnhancement {
  aiText: string | null;
  disclosure: string | null;
  fallbackReason?: string;
}

/** يضيف التأمل المولّد لملف جاهز. لا يرمي أخطاء أبداً: أي فشل ← aiText = null. */
export async function enhanceProfile(profile: ReflectiveProfile): Promise<AIEnhancement> {
  const none = (reason: string): AIEnhancement => ({ aiText: null, disclosure: null, fallbackReason: reason });
  try {
    const status = await getAIStatus();
    if (!status.enabled || !status.provider) return none('ai_disabled');

    const key = await getKey(status.provider);
    if (!key) return none('no_key');

    const userPrompt = `المحاور:\n${buildSafePayload(profile)}\n\nاكتب التأمل المطلوب.`;
    const raw =
      status.provider === 'gemini'
        ? await callGemini(key, userPrompt)
        : await callOpenAI(key, userPrompt);

    const clean = sanitizeOutput(raw);
    if (!clean) return none('output_rejected');
    return { aiText: clean, disclosure: AI_DISCLOSURE_LONG };
  } catch (e: any) {
    // لا نسجل المفتاح ولا النص — فقط رمز مختصر
    return none(String(e?.message ?? 'unknown').slice(0, 40));
  }
}

/**
 * يولّد القراءة التأملية. المحرك المحلي يعمل أولاً دائماً؛
 * وإن كان الذكاء الاصطناعي مفعّلاً يُضاف تأمل إضافي، وعند أي فشل تُعاد النتيجة المحلية.
 */
export async function generateReflection(
  name: string,
  layers: NameAnalysisLayers,
  opts: { useAI?: boolean } = {},
): Promise<ReflectionResult> {
  const profile = reflectiveArchetypesEngine.analyze(name, layers);
  const markdown = reflectiveArchetypesEngine.renderMarkdown(profile);
  const local: ReflectionResult = { markdown, aiText: null, source: 'local', disclosure: null, profile };
  if (opts.useAI === false) return local;

  const ai = await enhanceProfile(profile);
  if (!ai.aiText) return { ...local, fallbackReason: ai.fallbackReason };
  return { ...local, aiText: ai.aiText, source: 'ai', disclosure: ai.disclosure };
}
