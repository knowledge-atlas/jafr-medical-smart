import { AnalysisResult, NameAnalysisLayers } from '../application/use-cases/AnalyzeNameUseCase';
import { NarrativeWeaver } from '../ai/NarrativeWeaver';
import { ContextMode } from '../ai/ContextAwarePrompter';
import { ReportSection, ProductMeta } from './types';
import { ResonanceEngine, resonanceEngine } from '../domain/services/ResonanceEngine';
import { SchismEngine, schismEngine } from '../domain/services/SchismEngine';
import { TemporalAnalyzer, temporalAnalyzer } from '../domain/services/TemporalAnalyzer';

export interface DeepDiveOutput {
  meta: ProductMeta;
  name: string;
  sections: ReportSection[];
  markdown: string;
  sectionCount: number;
  wordCount: number;
}

export interface DeepDiveOptions {
  richMarkdown?: string;
}

const SECTION_META: Array<{ id: string; title: string; icon: string; weight: number }> = [
  { id: 'executive', title: 'الملخص التنفيذي', icon: '📋', weight: 2 },
  { id: 'identity', title: 'الهوية الاسمية', icon: '🪪', weight: 1 },
  { id: 'confidence', title: 'درجة الثقة', icon: '📊', weight: 1 },
  { id: 'resonance', title: 'الرنين الطبقي (نص البوني)', icon: '🎵', weight: 2 },
  { id: 'strengths', title: 'نقاط القوة', icon: '💪', weight: 2 },
  { id: 'challenges', title: 'التحديات', icon: '⚠️', weight: 2 },
  { id: 'shadow', title: 'الظل والجوانب الخفية', icon: '🌑', weight: 1 },
  { id: 'schism', title: 'خريطة الانسجام البنيوي (Schism)', icon: '⚖️', weight: 2 },
  { id: 'temporal', title: 'التقويم الزمني (7 أيام قادمة)', icon: '📅', weight: 2 },
  { id: 'record', title: 'بيانات السجل', icon: '📜', weight: 1 },
  { id: 'encyclopedia', title: 'الموسوعة الكاملة', icon: '📚', weight: 3 },
  { id: 'context', title: 'القراءة السياقية', icon: '🎯', weight: 2 },
  { id: 'recommendations', title: 'توصيات عملية', icon: '✅', weight: 2 },
  { id: 'smart', title: 'أهداف S.M.A.R.T', icon: '🎓', weight: 1 },
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

const PRODUCT_META = { productName: 'التقرير العميق', version: '1.5.0' };

const LAYER_LABELS: Record<string, string> = {
  root: 'الجذر', planet: 'الكوكب', sign: 'البرج', house: 'البيت',
};

function humanizeLayer(id?: string, kind?: string): string {
  if (!id) return '—';
  const s = String(id);
  const m = s.match(/(\d+)/);
  const prefix = kind ?? s.split('_')[0];
  const label = LAYER_LABELS[prefix] ?? prefix;
  return m ? `${label} ${m[1]}` : s;
}

function normalizeMarkdownLevels(md: string, offset: number = 2): string {
  return md.replace(/^(#{1,5})\s/gm, (_, hashes: string) => {
    const newLevel = Math.min(6, hashes.length + offset);
    return '#'.repeat(newLevel) + ' ';
  });
}

function numOf(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export class DeepDiveReport {
  constructor(
    private weaver: NarrativeWeaver = new NarrativeWeaver(),
    private resonance: ResonanceEngine = resonanceEngine,
    private schism: SchismEngine = schismEngine,
    private temporal: TemporalAnalyzer = temporalAnalyzer
  ) {}

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
    const now = new Date();
    const richNormalized = normalizeMarkdownLevels(richMarkdown, 2);

    const contentMap: Record<string, string> = {
      executive: narrative,
      identity: `- **الاسم:** ${analysis.name}\n- **الوضع السياقي:** ${MODE_LABEL[mode]}\n- **المُنتج:** v${PRODUCT_META.version}`,
      confidence: [
        `**النتيجة الإجمالية:** ${pct}% — تصنيف: **${analysis.confidence.level}**`,
        '',
        '**المحاور:**',
        `- جودة المدخل: ${(analysis.confidence.dimensions.inputQuality * 100).toFixed(0)}%`,
        `- اكتمال البيانات: ${(analysis.confidence.dimensions.dataCompleteness * 100).toFixed(0)}%`,
        `- اتساق الطبقات: ${(analysis.confidence.dimensions.layerConsistency * 100).toFixed(0)}%`,
        `- قوة الرنين: ${(analysis.confidence.dimensions.resonanceStrength * 100).toFixed(0)}%`,
        `- وضوح الوفق: ${(analysis.confidence.dimensions.wafqClarity * 100).toFixed(0)}%`,
        `- سجل التحقق: ${(analysis.confidence.dimensions.verificationHistory * 100).toFixed(0)}%`,
      ].join('\n'),
      resonance: this.resonanceRead(L, analysis),
      strengths: this.strengthsRead(L),
      challenges: this.challengesRead(L),
      shadow: this.shadowRead(L, analysis),
      schism: this.schismRead(L, analysis),
      temporal: this.temporalRead(L),
      record: [
        `- **الاسم:** ${analysis.name}`,
        `- **الجذر:** ${humanizeLayer(L.root, 'root')}`,
        `- **الكوكب:** ${L.planet ?? '—'}`,
        `- **البرج:** ${L.sign ?? '—'}`,
        `- **البيت:** ${humanizeLayer(L.house, 'house')}`,
        `- **الطبع:** ${L.element ?? '—'}`,
        `- **الوضع السياقي:** ${MODE_LABEL[mode]}`,
        `- **التاريخ:** ${now.toLocaleString('ar-EG')}`,
        `- **إصدار النظام:** ${PRODUCT_META.version}`,
      ].join('\n'),
      encyclopedia: richNormalized || 'لم يتم تحميل الموسوعة الكاملة لهذا الاسم.',
      context: this.contextRead(mode),
      recommendations: this.recommendationsRead(mode),
      smart: this.smartRead(mode),
      sources: [
        '- `master.txt` — الموسوعة الأم (467 KB)',
        '- `jafr_resonance.json` — 45 علاقة رنين حقيقية',
        '- الجذور الكاملة (9 جذور)',
        '- البواقي والأوفاق والتراكيب',
        '- **تحليل محلي 100% — دون أي اتصال**',
      ].join('\n'),
      disclaimer:
        'هذا تحليل نمطي لأغراض التأمل والمراجعة الذاتية. لا يُعدّ تشخيصاً طبياً ولا فتوى دينية ولا حكماً قاطعاً.',
      feedback: 'يمكنك تصنيف دقة هذا التقرير من الشاشة لتغذية النظام وتحسين دقته.',
      metadata: [
        `- المنتج: ${PRODUCT_META.productName} v${PRODUCT_META.version}`,
        `- الوضع: ${MODE_LABEL[mode]}`,
        `- الوضع دون اتصال: نعم`,
        `- التاريخ: ${now.toLocaleString('ar-EG')}`,
        `- عدد كلمات الموسوعة: ${richMarkdown.split(/\s+/).filter(Boolean).length}`,
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

  private resonanceRead(L: NameAnalysisLayers, a: AnalysisResult): string {
    const items: string[] = [];
    const rootNum = numOf(L.root);

    if (rootNum !== null) {
      const top = this.resonance.getTopForRoot(rootNum, 3);
      const weak = this.resonance.getWeakestForRoot(rootNum, 2);

      if (top.length > 0) {
        items.push('### 🌟 أقوى 3 رنين (نصوص البوني)');
        items.push('');
        for (const r of top) {
          const partner = r.rootA === rootNum ? r.rootB : r.rootA;
          items.push(`**${r.key} — الجذر ${rootNum} ↔ الجذر ${partner}** (${(r.strength * 100).toFixed(0)}%)`);
          items.push(`- **الوصف:** ${r.entry.description}`);
          items.push(`- **الظل:** ${r.entry.shadow}`);
          items.push(`- **الترياق:** ${r.entry.remedy}`);
          items.push('');
        }
      }

      if (weak.length > 0 && weak[0].strength < 0.6) {
        items.push('### ⚠️ أضعف رنين (يحتاج وعياً)');
        items.push('');
        for (const r of weak) {
          if (r.strength >= 0.6) continue;
          const partner = r.rootA === rootNum ? r.rootB : r.rootA;
          items.push(`**${r.key} — الجذر ${rootNum} ↔ الجذر ${partner}** (${(r.strength * 100).toFixed(0)}%)`);
          items.push(`- **التحدي:** ${r.entry.shadow}`);
          items.push(`- **الترياق:** ${r.entry.remedy}`);
          items.push('');
        }
      }
    }

    if (L.planet && L.sign) {
      items.push('### 🔗 روابط الطبقات');
      items.push('');
      items.push(`- **${humanizeLayer(L.root, 'root')} ↔ ${L.planet}**: الجوهر (الجذر) يلتقي بمحرك العاطفة (الكوكب).`);
      items.push(`- **${L.sign} ↔ ${L.element ?? '—'}**: البرج الطالع يعمل مع الطبع الأساسي.`);
    }

    return items.length > 0 ? items.join('\n') : 'لا توجد بيانات رنين كافية.';
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



  private temporalRead(L: NameAnalysisLayers): string {
    const rootNum = numOf(L.root);
    if (rootNum === null) return 'لا يوجد جذر محدّد لبناء التقويم الزمني.';

    const analysis = this.temporal.analyzeRange(new Date(), rootNum, 7);
    const lines: string[] = [];

    lines.push(analysis.summary);
    lines.push('');
    lines.push('### 📅 الأيام السبعة القادمة');
    lines.push('');

    for (const day of analysis.calendar) {
      const icon =
        day.quality === 'ذروة' ? '🌟'
        : day.quality === 'جيد' ? '✨'
        : day.quality === 'محايد' ? '⚖️'
        : day.quality === 'منخفض' ? '⚠️'
        : '💤';
      const scorePct = (day.score * 100).toFixed(0);
      lines.push(`**${day.date}** ${icon} **${day.quality}** (${scorePct}%)`);
      lines.push(`- mod9: ${day.mod9} · mod7: ${day.mod7} · mod12: ${day.mod12} · mod28: ${day.mod28}`);
      const firstLine = day.rootText.split('\n')[0];
      if (firstLine) lines.push(`- ${firstLine}`);
      lines.push('');
    }

    if (analysis.peakDays.length > 0) {
      lines.push('### 🌟 أقوى 3 أيام في الشهر');
      lines.push('');
      const top3 = this.temporal.topDays(analysis, 3);
      for (const d of top3) {
        lines.push(`- **${d.date}** (${(d.score * 100).toFixed(0)}%) — ${d.quality}`);
      }
      lines.push('');
    }

    if (analysis.criticalDays.length > 0) {
      lines.push('### ⚠️ أيام تحتاج انتباهاً');
      lines.push('');
      const bottom3 = this.temporal.bottomDays(analysis, 3);
      for (const d of bottom3) {
        lines.push(`- **${d.date}** (${(d.score * 100).toFixed(0)}%) — ${d.quality}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private schismRead(L: NameAnalysisLayers, _a: AnalysisResult): string {
    const result = this.schism.evaluate({
      root: L.root,
      planet: L.planet,
      sign: L.sign,
      element: L.element,
    });

    const pct = (result.coherence * 100).toFixed(0);
    const verdictIcon =
      result.verdict === 'منسجم' ? '✅'
      : result.verdict === 'توتّر طفيف' ? '⚠️'
      : '🔴';

    const lines: string[] = [];
    lines.push(`**الانسجام البنيوي:** ${pct}% — ${verdictIcon} **${result.verdict}**`);
    lines.push('');
    lines.push(`- **الطبع الغالب:** ${result.dominantElement}`);
    lines.push(`- **الطبع المفقود:** ${result.missingElement}`);
    lines.push('');
    lines.push('### تحليل الطبقات');
    lines.push('');
    for (const layer of result.layers) {
      lines.push(`- **${layer.source}** → الطبع: **${layer.element}**`);
    }
    lines.push('');
    if (result.pairs.length > 0) {
      lines.push('### تقييم التناغم بين الطبقات');
      lines.push('');
      for (const p of result.pairs) {
        const scorePct = (p.score * 100).toFixed(0);
        const marker = p.score >= 0.8 ? '💚' : p.score >= 0.5 ? '💛' : '❤️';
        lines.push(`- ${marker} **${p.a}** ↔ **${p.b}**: ${scorePct}%`);
      }
      lines.push('');
    }
    lines.push('### التفسير');
    lines.push('');
    lines.push(result.narrative);
    lines.push('');
    lines.push('### الترياق المقترح');
    lines.push('');
    lines.push(`> ${result.remedy}`);

    return lines.join('\n');
  }

  private shadowRead(L: NameAnalysisLayers, a: AnalysisResult): string {
    const lines: string[] = [];
    lines.push('**القاعدة:** الظل يظهر عند **تناقض الطبقات** — حين يخالف الطبع المكتسب الطبع الداخلي، أو حين يتضارب الكوكب المهيمن مع البرج الطالع.');
    lines.push('');

    const el = L.element;
    if (el === 'ترابي') {
      lines.push('**في حالتك (طبع ترابي):** الظل يظهر حين يتحول الاستقرار إلى **سجن**، والرصانة إلى **جمود**، والحفظ إلى **رفض للتغيير**.');
    } else if (el === 'ناري') {
      lines.push('**في حالتك (طبع ناري):** الظل يظهر حين يتحول الاندفاع إلى **تهور**، والحسم إلى **قسوة**، والمبادرة إلى **احتراق**.');
    } else if (el === 'هوائي') {
      lines.push('**في حالتك (طبع هوائي):** الظل يظهر حين يتحول التواصل إلى **سطحية**، والمرونة إلى **تذبذب**، والتفكير إلى **تشتت**.');
    } else if (el === 'مائي') {
      lines.push('**في حالتك (طبع مائي):** الظل يظهر حين يتحول التعاطف إلى **ذوبان**، والحساسية إلى **غرق**، والحدس إلى **وهم**.');
    }

    if (a.confidence.overall < 0.7) {
      lines.push('');
      lines.push('**ملاحظة:** درجة الثقة أقل من 70%، فالظل هنا تقديري.');
    }

    return lines.join('\n');
  }

  private contextRead(mode: ContextMode): string {
    const map: Record<ContextMode, string> = {
      personal: 'هذه القراءة تخدم **التأمل الذاتي** وتطوير الوعي بالأنماط. اقرأها كمرآة لا كحكم.',
      marital: 'القراءة تُعرض بوصفها **نقاط وعي للعلاقة**، وليست حكماً على أحد الطرفين.',
      professional: 'القراءة تُعرض **كمرآة للميول المهنية** والبيئات المناسبة.',
      commercial: 'القراءة تُعرض بوصفها **انطباعاً تسويقياً محتملاً**، لا ضماناً للنجاح.',
    };
    return map[mode];
  }

  private recommendationsRead(mode: ContextMode): string {
    const map: Record<ContextMode, string[]> = {
      personal: [
        '**10 دقائق مراقبة يومية**: سجّل نمطك السلوكي.',
        '**مذكرة أسبوعية**: راجع القرارات الكبرى كل جمعة.',
        '**جلسة تأمل شهرية**: راجع التقرير كل 30 يوماً.',
        '**قاعدة "لا قبل 24 ساعة"**: لا تتخذ قراراً كبيراً في يوم غضب أو فرح شديد.',
      ],
      marital: [
        '**قراءة مشتركة**: اقرآ التقرير معاً بصوت عالٍ.',
        '**نقطتا انسجام + نقطة وعي**: اكتبا معاً ما تريدان تعزيزه.',
        '**حوار شهري**: اجعلا التقرير أداة حوار، لا مادة خلاف.',
        '**قاعدة الأسبوع**: خصصا 15 دقيقة أسبوعياً.',
      ],
      professional: [
        '**طابق الميول مع البيئة**: قارن الطبائع مع طبيعة عملك.',
        '**مسار واحد لمدة 90 يوماً**: جرّب مساراً بديلاً.',
        '**سجّل النتائج**: استخدم المفكرة.',
        '**راجع ربع سنوي**: قيّم التطور كل 3 أشهر.',
      ],
      commercial: [
        '**اختبر مع 10 عملاء**: اعرض الاسم على جمهورك المستهدف.',
        '**قارن مع 3 منافسين**: ادرس الانطباع مقابل السوق.',
        '**اختبار A/B**: قبل أي استثمار تسويقي.',
        '**استشر مختص تسويق**: التقرير نقطة انطلاق.',
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
      '**M — قابل للقياس (Measurable):** حدد مؤشراً يومياً واحداً.',
      '**A — قابل للتحقيق (Achievable):** ضمن مواردك ووقتك.',
      '**R — ذو صلة (Relevant):** مرتبط بأحد التحديات المرصودة.',
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
    for (const s of sections) {
      lines.push('---');
      lines.push('');
      lines.push(`## ${s.icon} ${s.title}`);
      lines.push('');
      lines.push(s.content);
      lines.push('');
    }
    return lines.join('\n');
  }
}
