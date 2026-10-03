import { AnalysisResult, NameAnalysisLayers } from '../application/use-cases/AnalyzeNameUseCase';
import { NarrativeWeaver } from '../ai/NarrativeWeaver';
import { ContextMode } from '../ai/ContextAwarePrompter';
import { ReportSection, ProductMeta } from './types';
import { ResonanceEngine, resonanceEngine } from '../domain/services/ResonanceEngine';
import { SchismEngine, schismEngine } from '../domain/services/SchismEngine';
import { TemporalAnalyzer, temporalAnalyzer } from '../domain/services/TemporalAnalyzer';
import { ReflectiveArchetypesEngine, reflectiveArchetypesEngine } from '../domain/services/ReflectiveArchetypesEngine';

export interface DeepDiveOutput {
  meta: ProductMeta;
  name: string;
  sections: ReportSection[];
  markdown: string;
  sectionCount: number;
  wordCount: number;
  encyclopediaMarkdown: string;
}

export interface DeepDiveOptions {
  richMarkdown?: string;
}

const SECTION_META: Array<{ id: string; title: string; icon: string; weight: number }> = [
  { id: 'executive', title: 'الملخص التنفيذي', icon: '📋', weight: 2 },
  { id: 'identity', title: 'الهوية الاسمية', icon: '🪪', weight: 1 },
  { id: 'confidence', title: 'درجة الثقة (6 محاور)', icon: '📊', weight: 1 },
  { id: 'resonance', title: 'الرنين الطبقي (نص البوني)', icon: '🎵', weight: 2 },
  { id: 'strengths', title: 'نقاط القوة', icon: '💪', weight: 2 },
  { id: 'challenges', title: 'التحديات', icon: '⚠️', weight: 2 },
  { id: 'shadow', title: 'الظل والجوانب الخفية', icon: '🌑', weight: 1 },
  { id: 'schism', title: 'خريطة الانسجام البنيوي (Schism)', icon: '⚖️', weight: 2 },
  { id: 'psychology', title: 'الملف النفسي (12 محوراً)', icon: '🧠', weight: 3 },
  { id: 'temporal', title: 'التقويم الزمني (7 أيام)', icon: '📅', weight: 2 },
  { id: 'record', title: 'بيانات السجل', icon: '📜', weight: 1 },
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

const PRODUCT_META = { productName: 'التقرير العميق', version: '2.0.0' };

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
    private temporal: TemporalAnalyzer = temporalAnalyzer,
    private psychology: ReflectiveArchetypesEngine = reflectiveArchetypesEngine
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

    const encyclopediaMarkdown = rich
      ? `# 📚 الموسوعة الكاملة — ${analysis.name}\n\n${rich}`
      : '# 📚 الموسوعة الكاملة\n\nلم يتم تحميلها.';

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
      encyclopediaMarkdown,
    };
  }

  private buildSections(
    analysis: AnalysisResult,
    mode: ContextMode,
    richMarkdown: string
  ): ReportSection[] {
    const L: NameAnalysisLayers = analysis.layers ?? {};
    const now = new Date();

    const contentMap: Record<string, string> = {
      executive: this.executiveRead(analysis, mode),
      identity: this.identityRead(analysis, mode),
      confidence: this.confidenceRead(analysis),
      resonance: this.resonanceRead(L, analysis),
      strengths: this.strengthsRead(L),
      challenges: this.challengesRead(L),
      shadow: this.shadowRead(L, analysis),
      schism: this.schismRead(L, analysis),
      psychology: this.psychologyRead(analysis),
      temporal: this.temporalRead(L),
      record: this.recordRead(analysis, mode, richMarkdown, now),
      context: this.contextRead(mode),
      recommendations: this.recommendationsRead(mode),
      smart: this.smartRead(mode),
      sources: this.sourcesRead(richMarkdown),
      disclaimer: this.disclaimerRead(),
      feedback: this.feedbackRead(),
      metadata: this.metadataRead(analysis, mode, richMarkdown, now),
    };

    return SECTION_META.map((s) => ({
      id: s.id,
      title: s.title,
      icon: s.icon,
      weight: s.weight,
      content: contentMap[s.id] ?? '—',
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // 1. الملخص التنفيذي
  // ═══════════════════════════════════════════════════════════
  private executiveRead(analysis: AnalysisResult, mode: ContextMode): string {
    const narrative = this.weaver.weave(analysis, mode);
    const pct = (analysis.confidence.overall * 100).toFixed(0);
    const L = analysis.layers ?? {};
    const rootNum = numOf(L.root);

    const lines: string[] = [narrative];
    lines.push('');
    lines.push('### 🎯 ثلاث خلاصات رئيسية');
    lines.push('');
    if (rootNum) {
      lines.push(`1. **جوهرك** يتمحور حول **الجذر ${rootNum}** — بمحرك **${L.planet ?? 'غير محدد'}** وبرج **${L.sign ?? 'غير محدد'}**.`);
    }
    if (L.element) {
      const el = L.element === 'ناري' ? 'طبع **ناري** — اندفاع، حسم، وحركة'
        : L.element === 'ترابي' ? 'طبع **ترابي** — ثبات، بناء، وصبر'
        : L.element === 'هوائي' ? 'طبع **هوائي** — تواصل، مرونة، وتكيف'
        : 'طبع **مائي** — عمق، حساسية، وحدس';
      lines.push(`2. **طبعك** ${el}.`);
    }
    lines.push(`3. **درجة الاتساق الداخلي** للنموذج: **${pct}%** (${analysis.confidence.level}).`);
    lines.push('');
    lines.push('> هذا تحليل نمطي لا حتمي. اقرأ التقرير كخريطة للتأمل، لا كحكم نهائي.');

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 2. الهوية الاسمية
  // ═══════════════════════════════════════════════════════════
  private identityRead(analysis: AnalysisResult, mode: ContextMode): string {
    const L = analysis.layers ?? {};
    const lines: string[] = [];
    lines.push('| الحقل | القيمة |');
    lines.push('|:---|:---|');
    lines.push(`| الاسم الأصلي | **${analysis.name}** |`);
    lines.push(`| الوضع السياقي | ${MODE_LABEL[mode]} |`);
    lines.push(`| الجذر | ${humanizeLayer(L.root, 'root')} |`);
    lines.push(`| الكوكب المهيمن | ${L.planet ?? '—'} |`);
    lines.push(`| البرج الطالع | ${L.sign ?? '—'} |`);
    lines.push(`| البيت الفلكي | ${humanizeLayer(L.house, 'house')} |`);
    lines.push(`| الطبع الأساسي | ${L.element ?? '—'} |`);
    lines.push(`| درجة الثقة | ${(analysis.confidence.overall * 100).toFixed(0)}% |`);
    lines.push('');
    lines.push('> **ملاحظة:** التفاصيل الكاملة لكل طبقة موجودة داخل «الموسوعة الكاملة» (زر منفصل).');
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 3. درجة الثقة — 6 محاور
  // ═══════════════════════════════════════════════════════════
  private confidenceRead(analysis: AnalysisResult): string {
    const pct = (analysis.confidence.overall * 100).toFixed(0);
    const d = analysis.confidence.dimensions;
    const lines: string[] = [];
    lines.push(`**النتيجة الإجمالية:** ${pct}% — تصنيف: **${analysis.confidence.level}**`);
    lines.push('');
    lines.push('| المحور | القيمة | الوصف |');
    lines.push('|:---|:---|:---|');
    lines.push(`| جودة المدخل | ${(d.inputQuality * 100).toFixed(0)}% | صحة كتابة الاسم واكتمال الحروف |`);
    lines.push(`| اكتمال البيانات | ${(d.dataCompleteness * 100).toFixed(0)}% | توفر جميع الطبقات (جذر، كوكب، برج، بيت، طبع) |`);
    lines.push(`| اتساق الطبقات | ${(d.layerConsistency * 100).toFixed(0)}% | ترابط الطبقات فيما بينها |`);
    lines.push(`| قوة الرنين | ${(d.resonanceStrength * 100).toFixed(0)}% | جودة العلاقات مع الجذور الأخرى |`);
    lines.push(`| وضوح الوفق | ${(d.wafqClarity * 100).toFixed(0)}% | مدى انتظام المربع العددي |`);
    lines.push(`| سجل التحقق | ${(d.verificationHistory * 100).toFixed(0)}% | تغذية راجعة من تحليلات سابقة |`);
    lines.push('');
    lines.push('> هذه درجة **اتساق داخلي للنموذج** — ليست دقة علمية ولا احتمال صحة التنبؤات.');
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 4. الرنين الطبقي — 5 علاقات كاملة
  // ═══════════════════════════════════════════════════════════
  private resonanceRead(L: NameAnalysisLayers, _a: AnalysisResult): string {
    const rootNum = numOf(L.root);
    if (rootNum === null) return 'لا توجد بيانات رنين كافية.';

    const items: string[] = [];
    const top = this.resonance.getTopForRoot(rootNum, 3);
    const weak = this.resonance.getWeakestForRoot(rootNum, 2);

    if (top.length > 0) {
      items.push('### 🌟 أقوى 3 علاقات رنين (نصوص الإمام البوني)');
      items.push('');
      for (const r of top) {
        const partner = r.rootA === rootNum ? r.rootB : r.rootA;
        const icon = r.verdict === 'بناء' ? '💚' : r.verdict === 'توازن' ? '💛' : r.verdict === 'تحذير' ? '🟠' : '🔴';
        items.push(`#### ${icon} الجذر ${rootNum} ↔ الجذر ${partner} — قوة ${(r.strength * 100).toFixed(0)}%`);
        items.push('');
        items.push(`- **الوصف:** ${r.entry.description}`);
        items.push(`- **الظل:** ${r.entry.shadow}`);
        items.push(`- **الترياق:** ${r.entry.remedy}`);
        items.push('');
      }
    }

    if (weak.length > 0 && weak[0].strength < 0.65) {
      items.push('### ⚠️ علاقات تحتاج وعياً');
      items.push('');
      for (const r of weak) {
        if (r.strength >= 0.65) continue;
        const partner = r.rootA === rootNum ? r.rootB : r.rootA;
        items.push(`#### الجذر ${rootNum} ↔ الجذر ${partner} (${(r.strength * 100).toFixed(0)}%)`);
        items.push('');
        items.push(`- **التحدي:** ${r.entry.shadow}`);
        items.push(`- **الترياق:** ${r.entry.remedy}`);
        items.push('');
      }
    }

    // رنين الجذر مع نفسه
    const selfR = this.resonance.get(rootNum, rootNum);
    if (selfR) {
      items.push(`### 🔄 رنين الجذر مع نفسه (${rootNum}+${rootNum})`);
      items.push('');
      items.push(`- **الوصف:** ${selfR.entry.description}`);
      items.push(`- **الظل:** ${selfR.entry.shadow}`);
      items.push(`- **الترياق:** ${selfR.entry.remedy}`);
      items.push('');
    }

    return items.length > 0 ? items.join('\n') : 'لا توجد بيانات رنين كافية.';
  }

  // ═══════════════════════════════════════════════════════════
  // 5. نقاط القوة
  // ═══════════════════════════════════════════════════════════
  private strengthsRead(L: NameAnalysisLayers): string {
    const items: string[] = [];
    if (L.element === 'ناري') {
      items.push('**🔥 شجاعة ومبادرة** — قدرة على إطلاق المشاريع وكسر الجمود.');
      items.push('**✨ حضور طاغٍ** — يفرض نفسه في أي مجلس أو اجتماع.');
      items.push('**⚡ حسم سريع** — لا يعرف التردد في القرارات الحاسمة.');
      items.push('**🚀 قدرة على الإلهام** — يحفّز من حوله بالطاقة والرؤية.');
    }
    if (L.element === 'ترابي') {
      items.push('**🏛️ التزام طويل المدى** — يصبر على البناء حتى يُثمر.');
      items.push('**📊 موثوقية عالية** — من يمكن الاعتماد عليه في الأزمات.');
      items.push('**🏗️ تنظيم وحفظ** — يجيد بناء الأنظمة والمحافظة عليها.');
      items.push('**💎 واقعية عملية** — يحوّل الأفكار إلى نتائج ملموسة.');
    }
    if (L.element === 'هوائي') {
      items.push('**🌬️ تواصل مرن** — يجيد التكيف مع أي شخص أو موقف.');
      items.push('**💡 تفكير سريع** — يستوعب الأفكار ويولّد الحلول.');
      items.push('**🌐 شبكة واسعة** — روابط اجتماعية قوية ومتنوعة.');
      items.push('**🎭 فضول معرفي** — يتعلم بسرعة ويتابع الجديد.');
    }
    if (L.element === 'مائي') {
      items.push('**💧 ذكاء عاطفي** — يقرأ ما لا يُقال ويشعر بالجو.');
      items.push('**🔮 حدس مرهف** — يتلمّس الحقائق قبل ظهورها.');
      items.push('**💖 عمق تعاطفي** — يستوعب آلام الآخرين ويشفيها.');
      items.push('**🎨 حساسية فنية** — يقرأ الجمال والمعاني بعمق.');
    }
    if (L.root) {
      items.push(`**🌱 اتصال بـ${humanizeLayer(L.root, 'root')}** — يمنحك ثباتاً جوهرياً في الأزمات.`);
    }
    if (L.planet) {
      items.push(`**⚙️ محرك ${L.planet}** — يمنحك طاقة يومية مميزة في التحرك والتفاعل.`);
    }
    return items.length > 0 ? items.map((x) => `- ${x}`).join('\n') : '- تُحدد عند اكتمال البيانات.';
  }


  // ═══════════════════════════════════════════════════════════
  // 6. التحديات
  // ═══════════════════════════════════════════════════════════
  private challengesRead(L: NameAnalysisLayers): string {
    const items: string[] = [];
    if (L.element === 'ناري') {
      items.push('**⚡ تسرّع** — قرارات غير مدروسة عند الاندفاع.');
      items.push('**🔥 احتراق داخلي** — استنزاف سريع للطاقة.');
      items.push('**🎯 صدام محتمل** — مع من لا يواكب إيقاعك.');
      items.push('**😤 نفاد صبر** — صعوبة في تحمّل البطء.');
    }
    if (L.element === 'ترابي') {
      items.push('**🏔️ مقاومة للتغيير** — ميل للجمود والتمسك بالمألوف.');
      items.push('**🐢 بطء التكيف** — صعوبة مع الفوضى والمفاجآت.');
      items.push('**🔒 تشدد** — التمسك بالرأي حتى مع ظهور أدلة جديدة.');
      items.push('**😐 برود عاطفي** — صعوبة في التعبير عن المشاعر.');
    }
    if (L.element === 'هوائي') {
      items.push('**🌪️ تشتت** — تنقل مستمر بين الأفكار دون إكمال.');
      items.push('**🌊 سطحية محتملة** — الخوف من العمق والتعمق.');
      items.push('**😰 قلق ذهني** — التفكير الزائد يستهلك الطاقة.');
      items.push('**🔗 ارتباط سطحي** — علاقات كثيرة لكن غير عميقة.');
    }
    if (L.element === 'مائي') {
      items.push('**🌊 تأثر مفرط** — المشاعر المحيطة تسحبك بسهولة.');
      items.push('**💭 غرق في الذاكرة** — الماضي يقيّد الحاضر.');
      items.push('**🫧 ذوبان في الآخر** — صعوبة في تحديد الحدود.');
      items.push('**😢 حساسية جارحة** — التأثر بالكلمات أكثر من اللازم.');
    }
    if (L.root) {
      items.push(`**🌱 تحدي الجذر ${L.root}** — قد يتطلب وعياً بنقاط انهياره.`);
    }
    return items.length > 0 ? items.map((x) => `- ${x}`).join('\n') : '- لا توجد تحديات مرصودة.';
  }

  // ═══════════════════════════════════════════════════════════
  // 7. الظل والجوانب الخفية
  // ═══════════════════════════════════════════════════════════
  private shadowRead(L: NameAnalysisLayers, a: AnalysisResult): string {
    const lines: string[] = [];

    lines.push('### 📖 القاعدة الأساسية');
    lines.push('');
    lines.push('الظل يظهر عند **تناقض الطبقات** — حين يخالف الطبع المكتسب الطبع الداخلي، أو حين يتضارب الكوكب المهيمن مع البرج الطالع.');
    lines.push('');

    const el = L.element;
    if (el === 'ترابي') {
      lines.push('### 🌑 في حالتك (طبع ترابي)');
      lines.push('');
      lines.push('- الظل يظهر حين يتحول **الاستقرار إلى سجن**.');
      lines.push('- حين تتحول **الرصانة إلى جمود**.');
      lines.push('- حين يتحول **الحفظ إلى رفض للتغيير**.');
      lines.push('- حين يصبح **الأمان أهم من النمو**.');
    } else if (el === 'ناري') {
      lines.push('### 🌑 في حالتك (طبع ناري)');
      lines.push('');
      lines.push('- الظل يظهر حين يتحول **الاندفاع إلى تهور**.');
      lines.push('- حين يتحول **الحسم إلى قسوة**.');
      lines.push('- حين تتحول **المبادرة إلى احتراق**.');
      lines.push('- حين تصبح **القيادة تسلطاً**.');
    } else if (el === 'هوائي') {
      lines.push('### 🌑 في حالتك (طبع هوائي)');
      lines.push('');
      lines.push('- الظل يظهر حين يتحول **التواصل إلى سطحية**.');
      lines.push('- حين تتحول **المرونة إلى تذبذب**.');
      lines.push('- حين يتحول **التفكير إلى تشتت**.');
      lines.push('- حين تصبح **الحرية هروباً**.');
    } else if (el === 'مائي') {
      lines.push('### 🌑 في حالتك (طبع مائي)');
      lines.push('');
      lines.push('- الظل يظهر حين يتحول **التعاطف إلى ذوبان**.');
      lines.push('- حين تتحول **الحساسية إلى غرق**.');
      lines.push('- حين يتحول **الحدس إلى وهم**.');
      lines.push('- حين تصبح **الرعاية استنزافاً**.');
    } else {
      lines.push('*لم يُحدد الطبع، فالظل هنا تقديري.*');
    }

    lines.push('');
    lines.push('### ⚠️ ملاحظة مهمة');
    lines.push('');
    if (a.confidence.overall < 0.7) {
      lines.push('درجة الثقة أقل من 70% — الظل هنا تقديري، ويحتاج تحققاً من التجربة الشخصية.');
    } else {
      lines.push('الظل ليس عيباً، بل **جانب طبيعي من النمط**. الوعي به يُحوّله من نقطة ضعف إلى مصدر قوة.');
    }

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 8. Schism — خريطة الانسجام
  // ═══════════════════════════════════════════════════════════
  private schismRead(L: NameAnalysisLayers, _a: AnalysisResult): string {
    const result = this.schism.evaluate({
      root: L.root,
      planet: L.planet,
      sign: L.sign,
      element: L.element,
    });

    const pct = (result.coherence * 100).toFixed(0);
    const icon =
      result.verdict === 'منسجم' ? '✅' :
      result.verdict === 'توتّر طفيف' ? '⚠️' : '🔴';

    const lines: string[] = [];
    lines.push(`**الانسجام البنيوي:** ${pct}% — ${icon} **${result.verdict}**`);
    lines.push('');
    lines.push('### 🧬 تحليل الطبقات');
    lines.push('');
    lines.push('| الطبقة | الطبع |');
    lines.push('|:---|:---|');
    for (const layer of result.layers) {
      lines.push(`| ${layer.source} | ${layer.element} |`);
    }
    lines.push('');
    lines.push(`- **الطبع الغالب:** ${result.dominantElement}`);
    lines.push(`- **الطبع المفقود:** ${result.missingElement}`);
    lines.push('');

    if (result.pairs.length > 0) {
      lines.push('### 💚 تقييم التناغم بين الطبقات');
      lines.push('');
      for (const p of result.pairs) {
        const scorePct = (p.score * 100).toFixed(0);
        const marker = p.score >= 0.8 ? '💚' : p.score >= 0.5 ? '💛' : '❤️';
        lines.push(`- ${marker} **${p.a}** ↔ **${p.b}**: ${scorePct}%`);
      }
      lines.push('');
    }

    lines.push('### 📖 التفسير');
    lines.push('');
    lines.push(result.narrative);
    lines.push('');
    lines.push('### 💡 الترياق المقترح');
    lines.push('');
    lines.push(`> ${result.remedy}`);

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 9. الملف النفسي — 12 محوراً
  // ═══════════════════════════════════════════════════════════
  private psychologyRead(analysis: AnalysisResult): string {
    const L = analysis.layers ?? {};
    const profile = this.psychology.analyze(analysis.name, L);

    const lines: string[] = [];
    lines.push(`**التوازن العام:** ${(profile.overallBalance * 100).toFixed(0)}%`);
    lines.push('');
    lines.push(`**أقوى محور:** ${profile.dominantAxis} · **أضعف محور:** ${profile.weakestAxis}`);
    lines.push('');

    lines.push('### 📊 جدول المحاور الـ 12');
    lines.push('');
    lines.push('| المحور | النتيجة | التصنيف |');
    lines.push('|:---|:---|:---|');
    for (const axis of profile.axes) {
      lines.push(`| ${axis.icon} ${axis.title} | ${(axis.score * 100).toFixed(0)}% | ${axis.level} |`);
    }
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('### 📖 التحليل التفصيلي لكل محور');
    lines.push('');
    for (const axis of profile.axes) {
      lines.push(`#### ${axis.icon} ${axis.index}. ${axis.title}`);
      lines.push('');
      lines.push(`**النتيجة:** ${(axis.score * 100).toFixed(0)}% — ${axis.level}`);
      lines.push('');
      lines.push(axis.narrative);
      if (axis.insight) {
        lines.push('');
        lines.push(`> 💡 ${axis.insight}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 10. التقويم الزمني
  // ═══════════════════════════════════════════════════════════
  private temporalRead(L: NameAnalysisLayers): string {
    const rootNum = numOf(L.root);
    if (rootNum === null) return 'لا يوجد جذر محدّد لبناء التقويم الزمني.';

    const analysis = this.temporal.analyzeRange(new Date(), rootNum, 7);
    const lines: string[] = [];
    lines.push(analysis.summary);
    lines.push('');
    lines.push('### 📅 الأيام السبعة القادمة');
    lines.push('');
    lines.push('| التاريخ | الطاقة | الجودة | mod9 | mod7 | mod12 | mod28 |');
    lines.push('|:---|:---|:---|:---|:---|:---|:---|');
    for (const day of analysis.calendar) {
      const icon =
        day.quality === 'ذروة' ? '🌟' :
        day.quality === 'جيد' ? '✨' :
        day.quality === 'محايد' ? '⚖️' :
        day.quality === 'منخفض' ? '⚠️' : '💤';
      lines.push(`| ${day.date} | ${(day.score * 100).toFixed(0)}% | ${icon} ${day.quality} | ${day.mod9} | ${day.mod7} | ${day.mod12} | ${day.mod28} |`);
    }
    lines.push('');

    if (analysis.peakDays.length > 0) {
      lines.push('### 🌟 أيام الذروة هذا الشهر');
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

    lines.push('> 💡 للحصول على تقويم مخصص حتى 60 يوماً — افتح «📅 التقويم الزمني» من شاشة المنتجات.');

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 11. بيانات السجل
  // ═══════════════════════════════════════════════════════════
  private recordRead(
    analysis: AnalysisResult,
    mode: ContextMode,
    richMarkdown: string,
    now: Date
  ): string {
    const L = analysis.layers ?? {};
    const wordCount = richMarkdown.split(/\s+/).filter(Boolean).length;

    const lines: string[] = [];
    lines.push('| الحقل | القيمة |');
    lines.push('|:---|:---|');
    lines.push(`| الاسم | **${analysis.name}** |`);
    lines.push(`| الجذر | ${humanizeLayer(L.root, 'root')} |`);
    lines.push(`| الكوكب | ${L.planet ?? '—'} |`);
    lines.push(`| البرج | ${L.sign ?? '—'} |`);
    lines.push(`| البيت | ${humanizeLayer(L.house, 'house')} |`);
    lines.push(`| الطبع | ${L.element ?? '—'} |`);
    lines.push(`| الوضع السياقي | ${MODE_LABEL[mode]} |`);
    lines.push(`| التاريخ | ${now.toLocaleString('ar-EG')} |`);
    lines.push(`| إصدار النظام | ${PRODUCT_META.version} |`);
    lines.push(`| كلمات الموسوعة | ${wordCount} |`);
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 12. القراءة السياقية
  // ═══════════════════════════════════════════════════════════
  private contextRead(mode: ContextMode): string {
    const map: Record<ContextMode, string> = {
      personal: [
        '### 🧠 قراءة شخصية',
        '',
        'هذه القراءة تخدم **التأمل الذاتي** وتطوير الوعي بالأنماط. اقرأها كمرآة لا كحكم.',
        '',
        '**كيف تستفيد منها:**',
        '- اختر **نمطاً واحداً** فقط للعمل عليه خلال 30 يوماً.',
        '- لا تحاول إصلاح كل شيء دفعة واحدة.',
        '- سجّل ملاحظاتك اليومية لرؤية الأنماط بوضوح.',
        '- اقرأ التقرير مرة كل 30 يوماً لمتابعة التطور.',
      ].join('\n'),
      marital: [
        '### 💞 قراءة للعلاقة',
        '',
        'القراءة تُعرض بوصفها **نقاط وعي للعلاقة**، وليست حكماً على أحد الطرفين.',
        '',
        '**كيف تستفيد منها:**',
        '- شارِكها مع الشريك كأداة حوار — لا كسلاح.',
        '- ركّزا على **نقطتَي انسجام** و**نقطة وعي** واحدة.',
        '- راجعاها كل شهر معاً.',
        '- استعينا بمختص إذا استمر الخلاف.',
      ].join('\n'),
      professional: [
        '### 💼 قراءة مهنية',
        '',
        'القراءة تُعرض **كمرآة للميول المهنية** والبيئات المناسبة.',
        '',
        '**كيف تستفيد منها:**',
        '- قارنها مع بيئة عملك الحالية.',
        '- اختبر **مساراً واحداً بديلاً** خلال 90 يوماً.',
        '- وثّق النتائج قبل اتخاذ قرار كبير.',
        '- راجع التقرير كل 3 أشهر.',
      ].join('\n'),
      commercial: [
        '### 🏷️ قراءة تجارية',
        '',
        'القراءة تُعرض بوصفها **انطباعاً تسويقياً محتملاً**، لا ضماناً للنجاح.',
        '',
        '**كيف تستفيد منها:**',
        '- اختبر الاسم مع **10 عملاء محتملين**.',
        '- قارنه مع **3 منافسين** في السوق.',
        '- أجرِ **اختبار A/B** قبل أي استثمار كبير.',
        '- استشر مختص تسويق قبل القرار النهائي.',
      ].join('\n'),
    };
    return map[mode];
  }

  // ═══════════════════════════════════════════════════════════
  // 13. توصيات عملية
  // ═══════════════════════════════════════════════════════════
  private recommendationsRead(mode: ContextMode): string {
    const map: Record<ContextMode, string[]> = {
      personal: [
        '**📝 10 دقائق مراقبة يومية**: سجّل نمطك السلوكي في دفتر صغير.',
        '**📅 مذكرة أسبوعية**: راجع القرارات الكبرى كل جمعة.',
        '**🧘 جلسة تأمل شهرية**: راجع التقرير كل 30 يوماً.',
        '**⏸️ قاعدة "لا قبل 24 ساعة"**: لا تتخذ قراراً كبيراً في يوم غضب أو فرح شديد.',
      ],
      marital: [
        '**📖 قراءة مشتركة**: اقرآ التقرير معاً بصوت عالٍ.',
        '**✍️ نقطتا انسجام + نقطة وعي**: اكتبا ما تريدان تعزيزه وتحسينه.',
        '**💬 حوار شهري**: اجعلا التقرير أداة حوار، لا مادة خلاف.',
        '**⏰ قاعدة الأسبوع**: خصصا 15 دقيقة أسبوعياً لمناقشة نمطكما.',
      ],
      professional: [
        '**🎯 طابق الميول مع البيئة**: قارن الطبائع مع طبيعة عملك.',
        '**🧪 مسار واحد لمدة 90 يوماً**: جرّب مساراً بديلاً.',
        '**📓 سجّل النتائج**: استخدم المفكرة.',
        '**🔄 راجع ربع سنوي**: قيّم التطور كل 3 أشهر.',
      ],
      commercial: [
        '**👥 اختبر مع 10 عملاء**: اعرض الاسم على جمهورك المستهدف.',
        '**🔍 قارن مع 3 منافسين**: ادرس الانطباع مقابل السوق.',
        '**🧪 اختبار A/B**: قبل أي استثمار تسويقي كبير.',
        '**💼 استشر مختص تسويق**: التقرير نقطة انطلاق، لا وجهة نهائية.',
      ],
    };
    return map[mode].map((x) => `- ${x}`).join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 14. S.M.A.R.T
  // ═══════════════════════════════════════════════════════════
  private smartRead(mode: ContextMode): string {
    const target = {
      personal: 'نمطاً شخصياً واحداً',
      marital: 'نقطة حوار واحدة',
      professional: 'مساراً مهنياً واحداً',
      commercial: 'قراراً تسويقياً واحداً',
    }[mode];
    return [
      `**S — محدد (Specific):** اختر ${target} للعمل عليه خلال 30 يوماً.`,
      '',
      '**M — قابل للقياس (Measurable):** حدد مؤشراً يومياً واحداً (مثل: عدد المرات التي لاحظت فيها النمط).',
      '',
      '**A — قابل للتحقيق (Achievable):** ضمن مواردك ووقتك — لا تطلب المستحيل.',
      '',
      '**R — ذو صلة (Relevant):** مرتبط مباشرة بأحد التحديات المرصودة أعلاه.',
      '',
      '**T — محدد زمنياً (Time-bound):** التزام بأفق 30 يوماً، ثم قيّم.',
    ].join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 15. المصادر
  // ═══════════════════════════════════════════════════════════
  private sourcesRead(richMarkdown: string): string {
    const wordCount = richMarkdown.split(/\s+/).filter(Boolean).length;
    return [
      '- 📚 **master.txt** — الموسوعة الأم (467 KB)',
      '- 🎵 **jafr_resonance.json** — 45 علاقة رنين حقيقية من نص الإمام البوني',
      '- 🌱 الجذور الكاملة (9 جذور)',
      '- 🔢 البواقي والأوفاق والتراكيب',
      '- 🏥 الموسوعة الطبية التكاملية',
      '- **تحليل محلي 100% — دون أي اتصال بالإنترنت**',
      '',
      `> حجم الموسوعة المُحمَّلة: **${wordCount} كلمة**.`,
    ].join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 16. إخلاء مسؤولية
  // ═══════════════════════════════════════════════════════════
  private disclaimerRead(): string {
    return [
      'هذا **تحليل نمطي** لأغراض التأمل والمراجعة الذاتية، وليس:',
      '',
      '- ❌ تشخيصاً طبياً',
      '- ❌ فتوى دينية',
      '- ❌ حكماً قاطعاً على الشخصية',
      '- ❌ تنبؤاً حتمياً',
      '',
      '**القرار النهائي** يبقى للمستخدم بعد استشارة المختصين.',
    ].join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 17. التغذية الراجعة
  // ═══════════════════════════════════════════════════════════
  private feedbackRead(): string {
    return [
      'يمكنك **تصنيف دقة هذا التقرير** من الشاشة لتغذية النظام وتحسين دقته.',
      '',
      '- 🟢 **دقيق** — النمط يطابق تجربتي',
      '- 🟡 **جزئي** — بعض النقاط تطابق',
      '- 🔴 **غير دقيق** — لا يعكس تجربتي',
      '',
      'تغذيتك تُخزَّن **محلياً على جهازك فقط** ولا تُشارك مع أي طرف خارجي.',
    ].join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // 18. البيانات الوصفية
  // ═══════════════════════════════════════════════════════════
  private metadataRead(
    analysis: AnalysisResult,
    mode: ContextMode,
    richMarkdown: string,
    now: Date
  ): string {
    const wordCount = richMarkdown.split(/\s+/).filter(Boolean).length;
    return [
      `- **المنتج:** ${PRODUCT_META.productName} v${PRODUCT_META.version}`,
      `- **الاسم:** ${analysis.name}`,
      `- **الوضع:** ${MODE_LABEL[mode]}`,
      `- **الوضع دون اتصال:** نعم`,
      `- **التاريخ:** ${now.toLocaleString('ar-EG')}`,
      `- **كلمات الموسوعة:** ${wordCount}`,
      `- **المعرف:** ${analysis.name}-${now.getTime()}`,
    ].join('\n');
  }

  // ═══════════════════════════════════════════════════════════
  // Renderer
  // ═══════════════════════════════════════════════════════════
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
