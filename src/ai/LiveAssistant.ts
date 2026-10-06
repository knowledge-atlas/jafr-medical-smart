import { defaultLLMCaller } from './defaultLLMCaller';
import { chatMemory } from './ChatMemory';

const BASE_SYSTEM = `أنت "مستشار الجفر الطبي الذكي" — مساعد تحليلي ذكي وودود.

## هويتك
- خبير في نظام الجفر الطبي الذكي (علم الحروف، الأعداد، الرموز).
- تتحدث العربية الفصحى بأسلوب هادئ، عميق، ودود.
- تُجيب كما تُجيب صديق خبير — بحرية، بلا قوالب جامدة.

## قواعد ذهبية
1. **تحدّث بحرية** — أنت في محادثة حقيقية، لا تقرير آلي.
2. **إن سُئلت عن اسم** → حلّله من معرفتك + اطلب التفاصيل إن نقصت.
3. **إن كان السياق يحوي محاور اسم** → استخدمها مباشرة دون إعادة سؤال.
4. **لا تقل "لم أجد"** إلا إن كان السؤال خارج النظام تماماً.
5. **اذكر مصدرك** عند الاقتباس (البوني، موسيوعة خارجية، إلخ).
6. **اختم بإيجاز** دون تكرار "هذا تحليل رمزي" إلا عند الضرورة.
7. **إن سأل المستخدم عن شيء غير جفري** (طبخ، برمجة) → رد بلطف بأن تخصصك الجفر.

## أسلوبك
- قصير ثم مفيد — لا حشو.
- استخدم القوائم عند التعداد، والفقرات عند الشرح.
- اسأل سؤالاً توضيحياً إن كان السؤال غامضاً.`;

export interface LiveAssistantParams {
  question: string;
  name?: string | null;
  contextSummary?: string | null;   // ملخص محاور الاسم الحالي (اختياري)
  onProgress?: (msg: string) => void;
}

export async function askLiveAssistant(params: LiveAssistantParams): Promise<{
  answer: string;
  usedAI: boolean;
  source: string;
}> {
  const { question, name, contextSummary, onProgress } = params;

  // ═══ 1) بناء system prompt ديناميكي ═══
  let system = BASE_SYSTEM;
  const activeName = name ?? chatMemory.getName();

  if (activeName && contextSummary) {
    system += `\n\n## السياق الحالي
الاسم النشط في المحادثة: **${activeName}**
ملخص محاوره:
${contextSummary}

عندما يسأل المستخدم عن "شخصيته" أو "تحليله" — هذا هو المقصود.`;
  } else if (activeName) {
    system += `\n\n## السياق الحالي
الاسم النشط: **${activeName}** (حلّله بناءً على معرفتك العامة إن لم تتوفر تفاصيل).`;
  }

  // ═══ 2) بناء prompt يحوي history + السؤال الجديد ═══
  const history = chatMemory.toPrompt();
  const userPrompt = history
    ? `## المحادثة السابقة\n${history}\n\n## سؤال المستخدم الجديد\n${question}`
    : question;

  // ═══ 3) استدعاء الـLLM ═══
  onProgress?.('🧠 أفكر...');
  try {
    const result = await defaultLLMCaller.generate(system, userPrompt);
    const answer = (result?.answer ?? '').trim();

    if (answer.length < 5) {
      throw new Error('رد فارغ');
    }

    // سجّل في الذاكرة
    chatMemory.add('user', question);
    chatMemory.add('assistant', answer);
    if (activeName) chatMemory.setName(activeName);

    return { answer, usedAI: true, source: 'live-llm' };
  } catch (e: any) {
    console.warn('⚠️ LiveAssistant LLM failed:', e);

    // ═══ Fallback بسيط — رد مهذب ═══
    const fallback = activeName
      ? `**${activeName}** — لم أستطع الاتصال بالذكاء الاصطناعي الآن.\n\nفعّل مفتاح API من الإعدادات لأجيبك حياً عن أي سؤال.`
      : `لم أستطع الاتصال بالذكاء الاصطناعي.\n\nفعّل مفتاح API من الإعدادات.`;

    return { answer: fallback, usedAI: false, source: 'fallback' };
  }
}
