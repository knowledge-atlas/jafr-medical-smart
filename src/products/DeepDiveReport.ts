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
  { id: 'root', title: 'الجذر الكوني', icon: '🌱', weight: 2 },
  { id: 'planet', title: 'الكوكب المهيمن', icon: '⭐', weight: 2 },
  { id: 'sign', title: 'البرج الطالع', icon: '♈', weight: 2 },
  { id: 'house', title: 'البيت الفلكي', icon: '🏛️', weight: 1 },
  { id: 'element', title: 'الطبع الأساسي', icon: '🔥', weight: 2 },
  { id: 'confidence', title: 'درجة الثقة', icon: '📊', weight: 1 },
  { id: 'resonance', title: 'الرنين الطبقي', icon: '🎵', weight: 1 },
  { id: 'strengths', title: 'نقاط القوة', icon: '💪', weight: 2 },
  { id: 'challenges', title: 'التحديات', icon: '⚠️', weight: 2 },
  { id: 'shadow', title: 'الظل والجوانب الخفية', icon: '🌑', weight: 1 },
  { id: 'context', title: 'القراءة السياقية', icon: '🎯', weight: 2 },
  { id: 'recommendations', title: 'توصيات عملية', icon: '✅', weight: 2 },
  { id: 'smart', title: 'أهداف S.M.A.R.T', icon: '🎓', weight: 1 },
  { id: 'sources', title: 'المصادر والمراجع', icon: '📚', weight: 1 },
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

const PRODUCT_META = { productName: 'التقرير العميق', version: '1.0.0' };

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

export class DeepDiveReport {
  constructor(private weaver: NarrativeWeaver = new NarrativeWeaver()) {}

  generate(analysis: AnalysisResult, mode: ContextMode = 'personal'): DeepDiveOutput {
    const sections = this.buildSections(analysis, mode);
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

  private buildSections(analysis: AnalysisResult, mode: ContextMode): ReportSection[] {
    const L: NameAnalysisLayers = analysis.layers ?? {};
    const pct = (analysis.confidence.overall * 100).toFixed(0);
    const narrative = this.weaver.weave(analysis, mode);

    const contentMap: Record<string, string> = {
      executive: narrative,
      identity: `الاسم الأصلي: **${analysis.name}** — الوضع السياقي: ${MODE_LABEL[mode]}.`,
      root: `${humanizeLayer(L.root, 'root')} — ${L.root ?? '—'}`,
      planet: L.planet ?? '—',
      sign: L.sign ?? '—',
      house: humanizeLayer(L.house, 'house'),
      element: this.elementRead(L.element),
      confidence: `**${pct}%** — تصنيف: ${analysis.confidence.level}.`,
      resonance: this.resonanceRead(analysis),
      strengths: this.strengthsRead(L),
      challenges: this.challengesRead(L),
      shadow: 'الجوانب الخفية تُقرأ من تناقض الطبقات. تظهر عند اختلاف الطبع عن الكوكب المهيمن.',
      context: this.contextRead(mode),
      recommendations: this.recommendationsRead(mode),
      smart: this.smartRead(mode),
      sources: `- قاعدة المعرفة الداخلية\n- master.txt (467 KB)\n- تحليل محلي بدون اتصال`,
      disclaimer:
        'هذا تحليل نمطي لأغراض التأمل والمراجعة الذاتية. لا يُعدّ تشخيصاً طبياً ولا فتوى دينية ولا حكماً قاطعاً.',
      feedback: 'يمكنك تصنيف دقة هذا التقرير من الشاشة لتغذية النظام وتحسين دقته.',
      metadata: `- المنتج: ${PRODUCT_META.productName} v${PRODUCT_META.version}\n- الوضع: ${MODE_LABEL[mode]}\n- الوضع دون اتصال: نعم`,
    };

    return SECTION_META.map((s) => ({
      id: s.id,
      title: s.title,
      icon: s.icon,
      weight: s.weight,
      content: contentMap[s.id] ?? '—',
    }));
  }

  private elementRead(el?: string): string {
    if (!el) return 'لم يُحدد الطبع.';
    const map: Record<string, string> = {
      ناري: 'طبع ناري — حرارة، مبادرة، وضوح.',
      ترابي: 'طبع ترابي — رسوخ، بناء، استمرارية.',
      هوائي: 'طبع هوائي — تواصل، مرونة، تبادل.',
      مائي: 'طبع مائي — عمق، حدس، تفاعل وجداني.',
    };
    return map[el] ?? `طبع: ${el}.`;
  }

  private resonanceRead(a: AnalysisResult): string {
    const L: NameAnalysisLayers = a.layers ?? {};
    const parts: string[] = [];
    if (L.root && L.planet) parts.push(`${humanizeLayer(L.root, 'root')} مع الكوكب ${L.planet}`);
    if (L.sign && L.element) parts.push(`البرج ${L.sign} مع الطبع ${L.element}`);
    return parts.length > 0 ? `تناغم: ${parts.join(' / ')}.` : 'لا توجد علاقات رنين واضحة.';
  }

  private strengthsRead(L: NameAnalysisLayers): string {
    const items: string[] = [];
    if (L.element === 'ناري') items.push('اندفاع وحسم في القرارات.');
    if (L.element === 'ترابي') items.push('قدرة على الالتزام طويل المدى.');
    if (L.element === 'هوائي') items.push('مهارات تواصل ومرونة عالية.');
    if (L.element === 'مائي') items.push('ذكاء عاطفي وحدس مرهف.');
    if (L.root) items.push(`اتصال بـ${humanizeLayer(L.root, 'root')} يمنح ثباتاً في الأزمات.`);
    return items.length > 0 ? items.map((x) => `- ${x}`).join('\n') : '- تُحدد عند اكتمال البيانات.';
  }

  private challengesRead(L: NameAnalysisLayers): string {
    const items: string[] = [];
    if (L.element === 'ناري') items.push('تسرّع قد يُوقع في قرارات غير مدروسة.');
    if (L.element === 'ترابي') items.push('مقاومة للتغيير وميل للجمود.');
    if (L.element === 'هوائي') items.push('تشتت وتنقل بين الأفكار.');
    if (L.element === 'مائي') items.push('تأثر مفرط بالمشاعر المحيطة.');
    return items.length > 0 ? items.map((x) => `- ${x}`).join('\n') : '- لا توجد تحديات مرصودة.';
  }

  private contextRead(mode: ContextMode): string {
    const map: Record<ContextMode, string> = {
      personal: 'هذه القراءة تخدم التأمل الذاتي وتطوير الوعي بالأنماط.',
      marital: 'القراءة تُعرض بوصفها نقاط وعي للعلاقة، وليست حكماً على أحد الطرفين.',
      professional: 'القراءة تُعرض كمرآة للميول المهنية والبيئات المناسبة.',
      commercial: 'القراءة تُعرض بوصفها انطباعاً تسويقياً محتملاً، لا ضماناً للنجاح.',
    };
    return map[mode];
  }

  private recommendationsRead(mode: ContextMode): string {
    const map: Record<ContextMode, string[]> = {
      personal: [
        'خصّص 10 دقائق يومياً لمراقبة النمط السلوكي.',
        'اكتب مذكرة أسبوعية عن القرارات الكبرى.',
        'راجع التقرير كل 30 يوماً لتتبع التطور.',
      ],
      marital: [
        'شارك الطرفان في قراءة التقرير معاً.',
        'حددا نقطتي انسجام ونقطة وعي للعمل عليها.',
        'راجعا التقرير كل شهر بصفته أداة حوار.',
      ],
      professional: [
        'طابق الميول الفطرية مع بيئة العمل الحالية.',
        'اختبر مساراً واحداً بديلاً خلال 90 يوماً.',
        'سجّل النتائج واستخدمها كتغذية راجعة.',
      ],
      commercial: [
        'اختبر انطباع الاسم مع 10 عملاء محتملين.',
        'قارن الاسم مع منافسين في نفس السوق.',
        'أجرِ اختبار A/B قبل أي استثمار تسويقي.',
      ],
    };
    return map[mode].map((x) => `- ${x}`).join('\n');
  }

  private smartRead(_mode: ContextMode): string {
    return [
      '**محدد (Specific):** اختر نقطة واحدة للعمل عليها.',
      '**قابل للقياس (Measurable):** حدد مؤشراً واضحاً.',
      '**قابل للتحقيق (Achievable):** ضمن الموارد المتاحة.',
      '**ذو صلة (Relevant):** مرتبط بالسياق الحالي.',
      '**محدد زمنياً (Time-bound):** أفق 30-90 يوماً.',
    ].join('\n');
  }

  private renderMarkdown(
    analysis: AnalysisResult,
    sections: ReportSection[],
    mode: ContextMode
  ): string {
    const lines: string[] = [];
    lines.push(`# 📖 التقرير العميق — ${analysis.name}`);
    lines.push('');
    lines.push(`> السياق: ${MODE_LABEL[mode]} — تم التوليد دون اتصال.`);
    lines.push('');
    for (const s of sections) {
      lines.push(`## ${s.icon} ${s.title}`);
      lines.push('');
      lines.push(s.content);
      lines.push('');
    }
    return lines.join('\n');
  }
}
