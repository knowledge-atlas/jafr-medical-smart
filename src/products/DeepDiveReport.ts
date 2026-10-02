import { AnalysisResult, NameAnalysisLayers } from '../application/use-cases/AnalyzeNameUseCase';
import { NarrativeWeaver } from '../ai/NarrativeWeaver';
import { ContextMode } from '../ai/ContextAwarePrompter';
import { ReportSection, ProductMeta } from './types';

export interface DeepDiveOutput {
  meta: ProductMeta;
  name: string;
  sections: ReportSection[];
  markdown: string;
  sectionCount: number;
  wordCount: number;
}

const SECTION_META: Array<{ id: string; title: string; icon: string; weight: number }> = [
  { id: 'executive', title: 'الملخص التنفيذي', icon: '📋', weight: 2 },
  { id: 'identity', title: 'الهوية الاسمية', icon: '🪪', weight: 1 },
  { id: 'confidence', title: 'درجة الثقة', icon: '📊', weight: 1 },
  { id: 'resonance', title: 'الرنين الطبقي', icon: '🎵', weight: 1 },
  { id: 'strengths', title: 'نقاط القوة', icon: '💪', weight: 2 },
  { id: 'challenges', title: 'التحديات', icon: '⚠️', weight: 2 },
  { id: 'shadow', title: 'الظل والجوانب الخفية', icon: '🌑', weight: 1 },
  { id: 'context', title: 'القراءة السياقية', icon: '🎯', weight: 2 },
  { id: 'recommendations', title: 'توصيات عملية', icon: '✅', weight: 2 },
  { id: 'smart', title: 'أهداف S.M.A.R.T', icon: '🎓', weight: 1 },
  { id: 'encyclopedia', title: 'الموسوعة الكاملة — الطبقات والرنين والطب', icon: '📚', weight: 3 },
  { id: 'sources', title: 'المصادر والمراجع', icon: '📖', weight: 1 },
  { id: 'disclaimer', title: 'إخلاء مسؤولية', icon: '⚖️', weight: 1 },
  { id: 'feedback', title: 'التغذية الراجعة', icon: '💬', weight: 1 },
  { id: 'metadata', title: 'البيانات الوصفية', icon: '🏷️', weight: 1 },
];

const MODE_LABEL: Record<ContextMode, string> = {
  personal: 'تحليل ذاتي',
  marital: 'توافق زواجي',
  professional: 'مسار مهني',
  commercial: 'تشخيص تجاري',
};

const PRODUCT_META = { productName: 'التقرير العميق', version: '1.1.0' };

const LAYER_LABELS: Record<string, string> = {
  root: 'الجذر',
  planet: 'الكوكب',
  sign: 'البرج',
  house: 'البيت',
};

function humanizeLayer(id?: string, kind?: string): string {
  if (!id) return '—';
  const s = String(id);
  const m = s.match(/(\d+)/);
  const prefix = kind ?? s.split('_')[0];
  const label = LAYER_LABELS[prefix] ?? prefix;
  return m ? `${label} ${m[1]}` : s;
}

export interface DeepDiveOptions {
  /** markdown الغني من buildStructuredReport (الموسوعة الكاملة) */
  richMarkdown?: string;
}

export class DeepDiveReport {
  constructor(private weaver: NarrativeWeaver = new NarrativeWeaver()) {}

  generate(
    analysis: AnalysisResult,
    mode: ContextMode = 'personal',
    options: DeepDiveOptions = {}
  ): DeepDiveOutput {
    const rich = options.richMarkdown ?? analysis.report ?? '';
    const sections = this.buildSections(analysis, mode, rich);
    const markdown = this.renderMarkdown(analysis, sections, mode);
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;
    const meta: ProductMeta = {
      productId: 'deep-dive-report',
      productName: PRODUCT_META.productName,
      version: PRODUCT_META.version,
      generatedAt: new Date().toISOString(),
      offline: true,
    };
    return {
      meta,
      name: analysis.name,
      sections,
      markdown,
      sectionCount: sections.length,
      wordCount,
    };
  }

  private buildSections(
    analysis: AnalysisResult,
    mode: ContextMode,
    richMarkdown: string
  ): ReportSection[] {
    const L: NameAnalysisLayers = analysis.layers ?? {};
    const pct = (analysis.confidence.overall * 100).toFixed(0);
    const narrative = this.weaver.weave(analysis, mode);

    const contentMap: Record<string, string> = {
      executive: narrative,
      identity: `الاسم الأصلي: **${analysis.name}** — الوضع السياقي: ${MODE_LABEL[mode]}.`,
      confidence: `**${pct}%** — تصنيف: ${analysis.confidence.level}.\n\n- جودة المدخل: ${(analysis.confidence.dimensions.inputQuality * 100).toFixed(0)}%\n- اكتمال البيانات: ${(analysis.confidence.dimensions.dataCompleteness * 100).toFixed(0)}%\n- اتساق الطبقات: ${(analysis.confidence.dimensions.layerConsistency * 100).toFixed(0)}%`,
      resonance: this.resonanceRead(analysis),
      strengths: this.strengthsRead(L),
      challenges: this.challengesRead(L),
      shadow: this.shadowRead(L),
      context: this.contextRead(mode),
      recommendations: this.recommendationsRead(mode),
      smart: this.smartRead(mode),
      encyclopedia: richMarkdown || 'لم يتم تحميل الموسوعة الكاملة لهذا الاسم.',
      sources: [
        '- `master.txt` — الموسوعة الأم (467 KB)',
        '- الجذور الكاملة (9 جذور)',
        '- البواقي والأوفاق والتراكيب',
        '- الموسوعة الطبية التكاملية',
        '- **تحليل محلي 100% — دون أي اتصال**',
      ].join('\n'),
      disclaimer:
        'هذا تحليل نمطي لأغراض التأمل والمراجعة الذاتية. لا يُعدّ تشخيصاً طبياً ولا فتوى دينية ولا حكماً قاطعاً. القرار النهائي يبقى للمستخدم بعد استشارة المختصين.',
      feedback:
        'يمكنك تصنيف دقة هذا التقرير من الشاشة لتغذية النظام وتحسين دقته. تغذيتك تُخزَّن محلياً ولا تُشارك مع أي طرف.',
      metadata: [
        `- المنتج: ${PRODUCT_META.productName} v${PRODUCT_META.version}`,
        `- الوضع: ${MODE_LABEL[mode]}`,
        `- الوضع دون اتصال: نعم`,
        `- التاريخ: ${new Date().toLocaleString('ar-EG')}`,
        `- عدد الكلمات: ${richMarkdown.split(/\s+/).filter(Boolean).length}`,
      ].join('\n'),
    };

    return SECTION_META.map((s) => ({
      id: s.id,
      title: s.title,
      icon: s.icon,
      weight: s.weight,
      content: contentMap[s.id] ?? '—',
    }));
  }

  private resonanceRead(a: AnalysisResult): string {
    const L: NameAnalysisLayers = a.layers ?? {};
    const parts: string[] = [];
    if (L.root && L.planet) parts.push(`**${humanizeLayer(L.root, 'root')}** مع كوكب **${L.planet}** — يمنح الرنين بين الجوهر والحدس.`);
    if (L.sign && L.element) parts.push(`**برج ${L.sign}** مع الطبع **${L.element}** — ينسّق الظاهر مع الباطن.`);
    if (L.house && L.root) parts.push(`**${humanizeLayer(L.house, 'house')}** يحدد مسرح التطبيق العملي لهذا الجذر.`);
    return parts.length > 0 ? parts.map((p) => `- ${p}`).join('\n') : 'لا توجد علاقات رنين واضحة.';
  }

  private strengthsRead(L: NameAnalysisLayers): string {
    const items: string[] = [];
    if (L.element === 'ناري') {
      items.push('**شجاعة ومبادرة**: قدرة على إطلاق المشاريع وكسر الجمود.');
      items.push('**حضور طاغٍ**: يفرض نفسه في أي مجلس.');
      items.push('**حسم سريع**: لا يعرف التردد في القرارات الحاسمة.');
    }
    if (L.element === 'ترابي') {
      items.push('**التزام طويل المدى**: يصبر على البناء حتى يُثمر.');
      items.push('**موثوقية عالية**: من يمكن الاعتماد عليه في الأزمات.');
      items.push('**تنظيم وحفظ**: يجيد بناء الأنظمة والمحافظة عليها.');
    }
    if (L.element === 'هوائي') {
      items.push('**تواصل مرن**: يجيد التكيف مع أي شخص.');
      items.push('**تفكير سريع**: يستوعب الأفكار ويولّد الحلول.');
      items.push('**شبكة واسعة**: روابط اجتماعية قوية.');
    }
    if (L.element === 'مائي') {
      items.push('**ذكاء عاطفي**: يقرأ ما لا يُقال.');
      items.push('**حدس مرهف**: يتلمّس الحقائق قبل ظهورها.');
      items.push('**عمق تعاطفي**: يستوعب آلام الآخرين ويشفيها.');
    }
    if (L.root) items.push(`**اتصال بـ${humanizeLayer(L.root, 'root')}**: يمنحك ثباتاً جوهرياً في الأزمات.`);
    return items.length > 0 ? items.map((x) => `- ${x}`).join('\n') : '- تُحدد عند اكتمال البيانات.';
  }

  private challengesRead(L: NameAnalysisLayers): string {
    const items: string[] = [];
    if (L.element === 'ناري') {
      items.push('**تسرّع**: قرارات غير مدروسة عند الاندفاع.');
      items.push('**احتراق داخلي**: استنزاف سريع للطاقة.');
    }
    if (L.element === 'ترابي') {
      items.push('**مقاومة للتغيير**: ميل للجمود والتمسك بالمألوف.');
      items.push('**بطء التكيف**: صعوبة في التعامل مع الفوضى والمفاجآت.');
    }
    if (L.element === 'هوائي') {
      items.push('**تشتت**: تنقل مستمر بين الأفكار دون إكمال.');
      items.push('**سطحية محتملة**: الخوف من العمق والتعمق.');
    }
    if (L.element === 'مائي') {
      items.push('**تأثر مفرط**: المشاعر المحيطة تسحبك بسهولة.');
      items.push('**غرق في الذاكرة**: الماضي يقيّد الحاضر.');
    }
    return items.length > 0 ? items.map((x) => `- ${x}`).join('\n') : '- لا توجد تحديات مرصودة.';
  }

  private shadowRead(L: NameAnalysisLayers): string {
    const lines: string[] = [
      'الجوانب الخفية تظهر عند **تناقض الطبقات** — حين يختلف الطبع المكتسب عن الطبع الداخلي، أو حين يشير الكوكب الداخلي إلى اتجاه يخالف البرج الطالع.',
    ];
    if (L.element && L.root) {
      lines.push('');
      lines.push(`في حالة "${L.element}" مع "${humanizeLayer(L.root, 'root')}"، الظل يظهر في صورة: **شد وجذب داخلي** بين رغبة الاستقرار ورغبة الانطلاق.`);
    }
    return lines.join('\n');
  }

  private contextRead(mode: ContextMode): string {
    const map: Record<ContextMode, string> = {
      personal: 'هذه القراءة تخدم **التأمل الذاتي** وتطوير الوعي بالأنماط. اقرأها كمرآة لا كحكم — خذ ما ينفعك واترك ما لا يشبهك.',
      marital: 'القراءة تُعرض بوصفها **نقاط وعي للعلاقة**، وليست حكماً على أحد الطرفين. شارِكها مع الشريك كأداة حوار لا كسلاح.',
      professional: 'القراءة تُعرض **كمرآة للميول المهنية** والبيئات المناسبة. استخدمها لاختيار البيئة التي يُزهر فيها نمطك، لا لتصنيف نفسك.',
      commercial: 'القراءة تُعرض بوصفها **انطباعاً تسويقياً محتملاً**، لا ضماناً للنجاح. جرّب اختبارها ميدانياً قبل أي استثمار.',
    };
    return map[mode];
  }

  private recommendationsRead(mode: ContextMode): string {
    const map: Record<ContextMode, string[]> = {
      personal: [
        '**10 دقائق مراقبة يومية**: سجّل نمطك السلوكي في دفتر صغير.',
        '**مذكرة أسبوعية**: راجع القرارات الكبرى كل جمعة.',
        '**جلسة تأمل شهرية**: راجع التقرير كل 30 يوماً لتتبع التطور.',
        '**قاعدة "لا قبل 24 ساعة"**: لا تتخذ قراراً كبيراً في يوم غضب أو فرح شديد.',
      ],
      marital: [
        '**قراءة مشتركة**: اقرآ التقرير معاً بصوت عالٍ.',
        '**نقطتا انسجام + نقطة وعي**: اكتبا معاً ما تريدان تعزيزه وما تريدان تحسينه.',
        '**حوار شهري**: اجعلا التقرير أداة حوار، لا مادة خلاف.',
        '**قاعدة الأسبوع**: خصصا 15 دقيقة أسبوعياً لمناقشة نمطكما.',
      ],
      professional: [
        '**طابق الميول مع البيئة**: قارن الطبائع مع طبيعة عملك الحالي.',
        '**مسار واحد لمدة 90 يوماً**: جرّب مساراً بديلاً لثلاثة أشهر — لا أكثر.',
        '**سجّل النتائج**: استخدم المفكرة لتوثيق التغذية الراجعة.',
        '**راجع ربع سنوي**: قيّم التطور كل 3 أشهر.',
      ],
      commercial: [
        '**اختبر مع 10 عملاء**: اعرض الاسم على 10 أشخاص من جمهورك المستهدف.',
        '**قارن مع 3 منافسين**: ادرس الانطباع مقابل السوق.',
        '**اختبار A/B**: قبل أي استثمار تسويقي كبير.',
        '**استشر مختص تسويق**: التقرير نقطة انطلاق، لا وجهة نهائية.',
      ],
    };
    return map[mode].map((x) => `- ${x}`).join('\n');
  }

  private smartRead(mode: ContextMode): string {
    const target = {
      personal: 'نمطاً شخصياً واحداً',
      marital: 'نقطة حوار واحدة',
      professional: 'مساراً مهنياً واحداً',
      commercial: 'قراراً تسويقياً واحداً',
    }[mode];
    return [
      `**S — محدد (Specific):** اختر ${target} للعمل عليه خلال 30 يوماً.`,
      '**M — قابل للقياس (Measurable):** حدد مؤشراً يومياً واحداً (مثال: عدد المرات التي لاحظت فيها النمط).',
      '**A — قابل للتحقيق (Achievable):** ضمن مواردك ووقتك — لا تطلب المستحيل.',
      '**R — ذو صلة (Relevant):** مرتبط مباشرة بأحد التحديات المرصودة أعلاه.',
      '**T — محدد زمنياً (Time-bound):** التزم بأفق 30 يوماً، ثم قيّم.',
    ].join('\n\n');
  }

  private renderMarkdown(
    analysis: AnalysisResult,
    sections: ReportSection[],
    mode: ContextMode
  ): string {
    const lines: string[] = [];
    lines.push(`# 📖 التقرير العميق — ${analysis.name}`);
    lines.push('');
    lines.push(`> **السياق:** ${MODE_LABEL[mode]} · **الوضع:** دون اتصال · **المُنتج:** v${PRODUCT_META.version}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    for (const s of sections) {
      lines.push(`## ${s.icon} ${s.title}`);
      lines.push('');
      lines.push(s.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    return lines.join('\n');
  }
}
