import { AnalysisResult } from '../application/use-cases/AnalyzeNameUseCase';

export type ContextMode = 'personal' | 'marital' | 'professional' | 'commercial';

export interface PromptPackage {
  mode: ContextMode;
  systemPrompt: string;
  focusPoints: string[];
  outputStructure: string;
  userPrompt: string;
}

const SYSTEM_BASE = `أنت محلل متخصص في نظام الجفر الطبي الذكي (KnowledgeAtlas Sovereign).

## قواعد صارمة
1. **أجب بالعربية الفصحى المبسطة فقط.** لا تستخدم الإنجليزية إلا للمصطلحات العلمية الضرورية.
2. **لا تكرر السؤال.** ابدأ مباشرة بالإجابة.
3. **اعتمد على البيانات المُرفقة.** إذا ذكرت "الجذر 2" فاشرح معناه الفعلي من الطبقات.
4. **اكتب 3-5 فقرات على الأقل.** لا تكتف بجملة أو جملتين.
5. **استخدم العناوين الفرعية** (###) لتنظيم الإجابة عند الحاجة.
6. **اختم بخلاصة عملية** في جملتين.

## محظورات أخلاقية
- لا وعظ ديني ولا فتوى.
- لا تشخيص طبي — وجّه للطبيب.
- لا تنبؤات قاطعة — التحليل نمطي لا حتمي.

## الأسلوب
- استخدم: "يُظهر"، "يشير إلى"، "يميل إلى".
- تجنب: "بالتأكيد"، "سوف يحدث"، "مقدر لك".
- اجعل الجمل قصيرة وواضحة.`;



const MODE_CONFIG: Record<
  ContextMode,
  { focus: string[]; structure: string; role: string }
> = {
  personal: {
    role: 'تحليل ذاتي عميق',
    focus: [
      'الطبع الأساسي والظل',
      'نقاط القوة الخفية',
      'توصيات عملية للتوازن',
    ],
    structure:
      '1) ملخص الطبع 2) القوة 3) التحدي 4) توصيات S.M.A.R.T',
  },
  marital: {
    role: 'توافق زواجي',
    focus: [
      'تناغم الطبائع',
      'نقاط الانسجام',
      'نقاط تحتاج وعياً',
      'توصيات للتواصل',
    ],
    structure:
      '1) ملخص التوافق 2) نقاط الانسجام 3) نقاط الوعي 4) توصيات',
  },
  professional: {
    role: 'اختيار مسار مهني',
    focus: [
      'الميول الفطرية',
      'البيئات المناسبة',
      'مجالات يُنصح بتجنبها',
    ],
    structure:
      '1) الميول 2) البيئات 3) المهارات 4) مسارات مقترحة',
  },
  commercial: {
    role: 'تشخيص اسم مشروع',
    focus: [
      'انطباع الاسم في السوق',
      'تناغم الاسم مع النشاط',
      'اقتراحات بديلة',
    ],
    structure:
      '1) قراءة الاسم 2) التناغم 3) بدائل 4) توصيات تسويقية',
  },
};

export class ContextAwarePrompter {
  buildPrompt(
    mode: ContextMode,
    analysis: AnalysisResult | null,
    userQuestion: string
  ): PromptPackage {
    const cfg = MODE_CONFIG[mode];
    const systemPrompt = `${SYSTEM_BASE}\n\nوضع السياق الحالي: ${cfg.role}.`;

    const layersBlock = analysis?.layers
      ? [
          `الجذر: ${analysis.layers.root ?? '—'}`,
          `الكوكب: ${analysis.layers.planet ?? '—'}`,
          `البرج: ${analysis.layers.sign ?? '—'}`,
          `الطبع: ${analysis.layers.element ?? '—'}`,
        ].join('\n')
      : 'لا يوجد تحليل كيانات مرفق.';

    const userPrompt = [
      `## سؤال المستخدم`,
      userQuestion,
      '',
      `## الطبقات المُحلَّلة`,
      layersBlock,
      '',
      `## المطلوب`,
      `اكتب تقريراً بصيغة: ${cfg.structure}.`,
      `ركّز على: ${cfg.focus.join(' / ')}.`,
    ].join('\n');

    return {
      mode,
      systemPrompt,
      focusPoints: cfg.focus,
      outputStructure: cfg.structure,
      userPrompt,
    };
  }
}

export const contextAwarePrompter = new ContextAwarePrompter();
