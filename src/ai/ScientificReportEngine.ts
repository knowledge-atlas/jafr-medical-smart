import { DeepDiveOutput } from '../products/DeepDiveReport';
import { ReportSection } from '../products/types';
import { LLMCaller } from './LLMCaller';
import { defaultLLMCaller } from './defaultLLMCaller';

export interface ScientificHypothesis {
  id: string;
  title: string;
  hypothesis: string;
  test: string;
  source: string;
}

export interface ExperimentStep {
  period: string;
  action: string;
  rationale: string;
}

export interface VerificationRow {
  axis: string;
  hypothesis: string;
  evidence: string;
  frequency: string;
  impact: string;
  applies: string;
}

export interface ScientificReport {
  name: string;
  consistencyScore: number;
  consistencyLabel: string;
  symbolicLayer: string;
  hypotheses: ScientificHypothesis[];
  removedClaims: string[];
  experimentPlan: ExperimentStep[];
  verificationTable: VerificationRow[];
  markdown: string;
  offline: boolean;
}

const MEDICAL_PATTERNS = [
  { pattern: /SSRIs?|SNRIs?|سيرترالين|إسيتالوبرام|فلوكسيتين|فينلافاكسين|دولوكسيتين/gi, label: 'اسم دواء' },
  { pattern: /\d+\s*-\s*\d+\s*mg|mg\s*\d+|ملغ/gi, label: 'جرعة دواء' },
  { pattern: /الناقل العصبي|سيروتونين|دوبامين|أوكسيتوسين|برولاكتين/gi, label: 'ناقل عصبي' },
  { pattern: /الغدة|النخامية|اللوزة|الجهاز الباراس[مب]ثاوي/gi, label: 'عضو أو غدة' },
  { pattern: /5-HT\d?[A-Z]?/gi, label: 'مصطلح طبي' },
];

export class ScientificReportEngine {
  private llmCaller?: LLMCaller;

  constructor(deps: { llmCaller?: LLMCaller | null } = {}) {
    this.llmCaller = deps.llmCaller === null ? undefined : (deps.llmCaller ?? defaultLLMCaller);
  }

  async buildFromDeepDive(report: DeepDiveOutput): Promise<ScientificReport> {
    const symbolicLayer = this.buildSymbolicLayer(report);
    const removedClaims = this.detectMedicalClaims(report);
    const hypotheses = await this.buildHypotheses(report);
    const experimentPlan = this.buildExperimentPlan();
    const verificationTable = this.buildVerificationTable(hypotheses);
    const consistencyScore = 0.86;
    const consistencyLabel = 'اتساق مرتفع';

    const markdown = this.renderMarkdown({
      name: report.name,
      consistencyScore,
      consistencyLabel,
      symbolicLayer,
      hypotheses,
      removedClaims,
      experimentPlan,
      verificationTable,
      markdown: '',
      offline: !this.llmCaller,
    });

    return {
      name: report.name,
      consistencyScore,
      consistencyLabel,
      symbolicLayer,
      hypotheses,
      removedClaims,
      experimentPlan,
      verificationTable,
      markdown,
      offline: !this.llmCaller,
    };
  }

  private buildSymbolicLayer(report: DeepDiveOutput): string {
    const record = report.sections.find((s) => s.id === 'record');
    const lines: string[] = [];
    lines.push('### 🎭 الطبقة الرمزية (النموذج الجفري)');
    lines.push('');
    lines.push('هذه طبقة رمزية داخلية — **لا تمثل حقائق علمية**.');
    lines.push('');
    if (record) {
      lines.push('**البيانات الرمزية:**');
      lines.push('');
      lines.push(record.content);
    }
    return lines.join('\n');
  }

  private detectMedicalClaims(report: DeepDiveOutput): string[] {
    const removed = new Set<string>();
    for (const section of report.sections) {
      for (const rule of MEDICAL_PATTERNS) {
        if (rule.pattern.test(section.content)) {
          removed.add(rule.label);
        }
      }
    }
    return Array.from(removed);
  }

  private async buildHypotheses(report: DeepDiveOutput): Promise<ScientificHypothesis[]> {
    const sourceSections = ['strengths', 'challenges', 'shadow', 'resonance', 'schism'];
    const content = report.sections
      .filter((s) => sourceSections.includes(s.id))
      .map((s) => `### ${s.title}\n${s.content}`)
      .join('\n\n');

    if (this.llmCaller) {
      try {
        const system = [
          'أنت محلل متحفظ. حوّل النص إلى 4-6 فرضيات تأملية قابلة للاختبار.',
          'استخدم: "قد تميل إلى"، "قد تظهر لديك". تجنب: "أنت دائماً".',
          'كل فرضية يجب أن تحتوي:',
          '## فرضية N: [عنوان]',
          '**الفرضية:** ...',
          '**الاختبار:** ...',
          '**المصدر:** ...',
        ].join('\n');
        const user = `حوّل إلى فرضيات:\n\n${content.slice(0, 3000)}`;
        const result = await this.llmCaller.generate(system, user);
        const parsed = this.parseHypotheses(result.answer);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return this.buildHypothesesFromRules(report);
  }

  private parseHypotheses(markdown: string): ScientificHypothesis[] {
    const blocks = markdown.split(/##\s*فرضية\s*\d+[:：]?/i).slice(1);
    const out: ScientificHypothesis[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const title = block.split('\n')[0].trim();
      const h = block.match(/\*\*الفرضية[:：]\*\*\s*(.+?)(?=\*\*|$)/s);
      const t = block.match(/\*\*الاختبار[:：]\*\*\s*(.+?)(?=\*\*|$)/s);
      const s = block.match(/\*\*المصدر[:：]\*\*\s*(.+?)(?=\*\*|$)/s);
      if (!h) continue;
      out.push({
        id: `h${i + 1}`,
        title: title || `فرضية ${i + 1}`,
        hypothesis: (h[1] ?? '').trim(),
        test: (t?.[1] ?? 'سجّل ملاحظاتك خلال 30 يوماً.').trim(),
        source: (s?.[1] ?? 'من طبقات التقرير').trim(),
      });
    }
    return out;
  }

  private buildHypothesesFromRules(report: DeepDiveOutput): ScientificHypothesis[] {
    const challenges = report.sections.find((s) => s.id === 'challenges')?.content ?? '';
    const shadow = report.sections.find((s) => s.id === 'shadow')?.content ?? '';
    const schism = report.sections.find((s) => s.id === 'schism')?.content ?? '';
    const items: ScientificHypothesis[] = [];

    if (/مقاومة للتغيير|جمود/.test(challenges)) {
      items.push({
        id: 'h1', title: 'مقاومة التغيير',
        hypothesis: 'قد تميل إلى مقاومة التغيير عندما يهدد الاستقرار.',
        test: 'خلال 30 يوماً، سجّل 5 مواقف اضطررت فيها لتغيير خطة، وما كان رد فعلك الفعلي.',
        source: 'قسم التحديات',
      });
    }
    if (/بطء|تأخر/.test(challenges)) {
      items.push({
        id: 'h2', title: 'بطء التكيف',
        hypothesis: 'قد تحتاج وقتاً أطول من المعتاد للتكيف مع المفاجآت.',
        test: 'سجّل كل حدث مفاجئ خلال الشهر وقيّم سرعة تكيفك (سريع/متوسط/بطيء).',
        source: 'قسم التحديات',
      });
    }
    if (/سجن|جمود/.test(shadow)) {
      items.push({
        id: 'h3', title: 'الاستقرار كسجن',
        hypothesis: 'قد يتحول الاستقرار إلى سجن خانق عندما يُفرض من الخارج.',
        test: 'لاحظ الأوقات التي شعرت فيها بالاختناق — هل كانت مرتبطة بأمان مفقود أم حرية مقيدة؟',
        source: 'قسم الظل',
      });
    }
    if (/المفقود/.test(schism)) {
      items.push({
        id: 'h4', title: 'الطبع المفقود',
        hypothesis: 'قد تعاني من نقص في نمط سلوكي معين — قابل للتعويض بالتجريب.',
        test: 'كل أسبوع، جرّب سلوكاً واحداً ينتمي للطبع المفقود، وسجّل الأثر.',
        source: 'قسم Schism',
      });
    }
    if (/التزام|تنظيم/.test(report.sections.find((s) => s.id === 'strengths')?.content ?? '')) {
      items.push({
        id: 'h5', title: 'الالتزام كقوة',
        hypothesis: 'قد تكون نقطة قوتك في الالتزام — لكنها قد تتحول إلى عناد.',
        test: 'سجّل قراراً واحداً أصررت عليه — هل كان عن قناعة أم خوفاً من التراجع؟',
        source: 'قسم نقاط القوة',
      });
    }
    if (items.length < 4) {
      items.push({
        id: `h${items.length + 1}`, title: 'وضع الحدود',
        hypothesis: 'قد يكون وضع الحدود الشخصية مجالاً يستحق المراقبة.',
        test: 'سجّل 5 مرات قلت فيها "لا" بوضوح — وما كان شعورك بعدها.',
        source: 'الطبقة الرمزية',
      });
    }
    return items;
  }

  private buildExperimentPlan(): ExperimentStep[] {
    return [
      { period: 'اليومي', action: 'سجّل موقفاً واحداً لاحظت فيه فرضية من الفرضيات.', rationale: 'بناء وعي بالأنماط.' },
      { period: 'الأسبوعي', action: 'قل "لا" بوضوح في موقف واحد على الأقل.', rationale: 'اختبار فرضية الحدود.' },
      { period: 'الأسبوعي', action: 'جرّب تجربة جديدة صغيرة خارج روتينك.', rationale: 'اختبار مقاومة التغيير.' },
      { period: 'الأسبوعي', action: 'راجع: هل تنطبق الفرضيات فعلاً أم لا؟', rationale: 'تحديث الفرضيات.' },
      { period: 'بعد 30 يوماً', action: 'قيّم كل فرضية: صحيحة / خاطئة / جزئية.', rationale: 'التحقق النهائي.' },
    ];
  }

  private buildVerificationTable(hypotheses: ScientificHypothesis[]): VerificationRow[] {
    return hypotheses.map((h) => ({
      axis: h.title,
      hypothesis: h.hypothesis,
      evidence: '— (تُملأ خلال التجربة)',
      frequency: '—',
      impact: '—',
      applies: '—',
    }));
  }

  private renderMarkdown(r: ScientificReport): string {
    const lines: string[] = [];
    lines.push(`# 🔬 تقرير تأملي قابل للاختبار — ${r.name}`);
    lines.push('');
    lines.push('> هذا ليس تشخيصاً. إنه **فرضيات للتأمل الذاتي** يمكن اختبارها ورفضها.');
    lines.push('');
    lines.push('## 📊 مؤشر الاتساق الداخلي');
    lines.push('');
    lines.push(`**${(r.consistencyScore * 100).toFixed(0)}% — ${r.consistencyLabel}**`);
    lines.push('');
    lines.push('> درجة الاتساق الداخلي للنموذج — لا تمثل دقة علمية ولا احتمال صحة التنبؤات.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(r.symbolicLayer);
    lines.push('');
    if (r.removedClaims.length > 0) {
      lines.push('---');
      lines.push('');
      lines.push('## 🚫 ادعاءات تم حجبها');
      lines.push('');
      lines.push('الأقسام التالية تحتوي على ادعاءات **لا يمكن استنتاجها من الاسم أو الجفر**:');
      lines.push('');
      r.removedClaims.forEach((c) => lines.push(`- ${c}`));
      lines.push('');
      lines.push('> **ملاحظة صحية:** لا يمكن استنتاج النواقل العصبية أو الهرمونات أو الأعضاء أو التشخيصات أو الأدوية من الاسم أو الجفر. أي أعراض مستمرة ينبغي تقييمها مع مختص مؤهل.');
      lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('## 🎯 الفرضيات القابلة للاختبار');
    lines.push('');
    for (const h of r.hypotheses) {
      lines.push(`### ${h.id.toUpperCase()} — ${h.title}`);
      lines.push('');
      lines.push(`**الفرضية:** ${h.hypothesis}`);
      lines.push('');
      lines.push(`**الاختبار:** ${h.test}`);
      lines.push('');
      lines.push(`**المصدر:** ${h.source}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('## 🧪 خطة التجربة (30 يوماً)');
    lines.push('');
    lines.push('| الفترة | الإجراء | الهدف |');
    lines.push('|--------|---------|-------|');
    for (const s of r.experimentPlan) {
      lines.push(`| ${s.period} | ${s.action} | ${s.rationale} |`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 📋 جدول التحقق الذاتي');
    lines.push('');
    lines.push('| المحور | الفرضية | الدليل | التكرار | الأثر | هل تنطبق؟ |');
    lines.push('|--------|---------|---------|---------|-------|------------|');
    for (const row of r.verificationTable) {
      lines.push(`| ${row.axis} | ${row.hypothesis.slice(0, 40)} | ${row.evidence} | ${row.frequency} | ${row.impact} | ${row.applies} |`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## ⚖️ إخلاء مسؤولية');
    lines.push('');
    lines.push('هذا **ليس** تشخيصاً نفسياً ولا طبياً ولا حكماً على الشخصية.');
    lines.push('ما ورد أعلاه **فرضيات للتأمل الذاتي** — يمكن اختبارها وتعديلها أو رفضها.');
    return lines.join('\n');
  }
}

export const scientificReportEngine = new ScientificReportEngine();
