import { buildAggregatedContext, contextToPrompt, AggregatedContext } from './ContextAggregator';
import { defaultLLMCaller } from './defaultLLMCaller';

// ═══════════════════════════════════════════════════════════
// قوالب احتياطية — تعمل بدون AI
// ═══════════════════════════════════════════════════════════
function buildTemplateAnswer(ctx: AggregatedContext, question: string): string {
  const parts: string[] = [];
  const L = ctx.layers ?? {};

  parts.push(`# تحليل "${ctx.name}" — إجابة عن: ${question}`);
  parts.push('');

  // ═══ الملخص الأساسي ═══
  const axes: string[] = [];
  if (L.root !== undefined) axes.push(`الجذر **${L.root}**`);
  if (L.planet) axes.push(`الكوكب **${L.planet}**`);
  if (L.sign) axes.push(`البرج **${L.sign}**`);
  if (L.element) axes.push(`الطبع **${L.element}**`);
  if (L.house !== undefined) axes.push(`البيت **${L.house}**`);

  if (axes.length) {
    parts.push(`## 🎯 محاور التحليل`);
    parts.push(axes.join(' · '));
    parts.push('');
  }

  // ═══ من التقرير التقليدي (نصوص البوني المركزة) ═══
  if (ctx.traditionalMarkdown) {
    const excerpt = ctx.traditionalMarkdown
      .split('\n')
      .filter((l) => {
        const n = String(l).replace(/[إأآا]/g, 'ا');
        if (!n || n.length < 30) return false;
        if (ctx.name && n.includes(ctx.name)) return true;
        if (L.root !== undefined && n.includes(`الجذر ${L.root}`)) return true;
        if (L.planet && n.includes(L.planet)) return true;
        if (L.sign && n.includes(L.sign)) return true;
        return false;
      })
      .slice(0, 12)
      .join('\n');

    if (excerpt) {
      parts.push(`## 📜 من التقرير التقليدي (نصوص البوني)`);
      parts.push(excerpt.slice(0, 1500));
      parts.push('');
    }
  }

  // ═══ الملف النفسي ═══
  if (ctx.reflectiveProfile) {
    parts.push(`## 🧠 الملف النفسي`);
    parts.push(`- **أقوى محور:** ${ctx.reflectiveProfile.dominantAxis}`);
    parts.push(`- **أضعف محور:** ${ctx.reflectiveProfile.weakestAxis}`);
    parts.push(`- **التوازن العام:** ${Math.round(ctx.reflectiveProfile.overallBalance * 100)}%`);
    parts.push('');
    ctx.reflectiveProfile.topAxes.slice(0, 3).forEach((a: any) => {
      parts.push(`### ${a.title} (${a.score}%)`);
      parts.push(a.narrative.slice(0, 400));
      parts.push('');
    });
  }

  // ═══ الشواهد الخارجية ═══
  if (ctx.externalEvidence.length > 0) {
    parts.push(`## 🌐 من الموسوعات الخارجية`);
    ctx.externalEvidence.slice(0, 4).forEach((ev, i) => {
      parts.push(`### ${i + 1}. ${ev.title}`);
      parts.push(`_المصدر: ${ev.source} · قوة التطابق: ${ev.score}_`);
      parts.push('');
      parts.push(ev.excerpt.slice(0, 600));
      parts.push('');
    });
  }

  parts.push('---');
  parts.push(`_📎 المصادر: ${ctx.sources.join(' · ')}_`);
  parts.push('');
  parts.push('_هذا تحليل رمزي — مرآة للتأمل لا حكم نهائي._');

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════
// systemPrompt — تعليمات للمساعد
// ═══════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `أنت مساعد تحليلي ذكي متخصص في "نظام الجفر الطبي الذكي".

## قواعد صارمة
1. **السياق الذي يصلك يحتوي بيانات الاسم كاملة** (محاور، نصوص البوني، ملف نفسي، شواهد خارجية).
2. **أجب من السياق مباشرة** — لا ترفض إلا إذا كان السؤال خارج نطاق التحليل تماماً (مثل: "كيف أطبخ الكسكس؟").
3. **إذا كان السؤال عن شخصية صاحب الاسم** — استنتج من المحاور (الجذر، الكوكب، البرج، الطبع، البيت) + الظل + القوة الأساسية + الترياق.
4. **اذكر المصدر بوضوح** بصيغة: "من الجذر 2 في التقرير التقليدي:" أو "من الملف النفسي:" أو "من الموسوعة الخارجية:".
5. **لا تقل "لم أجد"** إذا كانت البيانات متاحة — بل حلّل واجمع.

## أسلوب الإجابة
- ابدأ بجملة افتتاحية تحدد المطلوب.
- نظّم الإجابة بجداول أو قوائم عند الإقتضاء.
- اختم بالإشارة إلى "هذا تحليل رمزي — مرآة للتأمل لا حكم نهائي".

## سياق مهم
صاحب الاسم يريد فهم نفسه بعمق — لا ترفض، بل فسّر ما بين يديك بوضوح.`;

// ═══════════════════════════════════════════════════════════
// ask — الدالة الرئيسية
// ═══════════════════════════════════════════════════════════
export async function askWithContext(params: {
  question: string;
  name: string;
  analysis: any;
  deepDiveMarkdown?: string;
  traditionalMarkdown?: string;
  onProgress?: (msg: string) => void;
}): Promise<{ answer: string; sources: string[]; usedAI: boolean; context: AggregatedContext }> {
  const { question, name, analysis, deepDiveMarkdown, traditionalMarkdown, onProgress } = params;

  onProgress?.('🔍 جمع البيانات من المصادر...');
  const ctx = await buildAggregatedContext({
    name,
    analysis,
    question,
    deepDiveMarkdown,
    traditionalMarkdown,
  });

  onProgress?.(`✅ تم جمع ${ctx.externalEvidence.length} شاهد خارجي`);

  // ═══ حاول استخدام AI ═══
  try {
    onProgress?.('🧠 صياغة الإجابة...');
    const prompt = contextToPrompt(ctx, question);

    const result = await defaultLLMCaller.generate(SYSTEM_PROMPT, prompt);
    const aiResponse = result?.answer ?? '';

    if (aiResponse && aiResponse.trim().length > 40) {
      let answer = aiResponse.trim();
      if (!answer.includes('المصادر:')) {
        answer += `\n\n---\n_المصادر: ${ctx.sources.join(' · ')}_`;
      }
      return { answer, sources: ctx.sources, usedAI: true, context: ctx };
    }
  } catch (e) {
    console.warn('⚠️ AI failed, using template:', e);
  }

  // ═══ Fallback: قالب ذكي ═══
  onProgress?.('📝 بناء إجابة من المصادر مباشرة...');
  const answer = buildTemplateAnswer(ctx, question);
  return { answer, sources: ctx.sources, usedAI: false, context: ctx };
}
