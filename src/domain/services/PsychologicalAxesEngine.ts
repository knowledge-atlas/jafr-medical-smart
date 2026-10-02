import { NameAnalysisLayers } from '../../application/use-cases/AnalyzeNameUseCase';
import { ResonanceEngine, resonanceEngine } from './ResonanceEngine';
import { SchismEngine, schismEngine } from './SchismEngine';
import { TemporalAnalyzer, temporalAnalyzer } from './TemporalAnalyzer';
import {
  MEDICAL_ROOTS,
  MEDICAL_REMAINDERS,
} from '../../data/medicalRoots';

export type AxisLevel = 'مرتفع' | 'متوسط' | 'منخفض';

export interface PsychologicalAxis {
  id: string;
  index: number;
  title: string;
  icon: string;
  score: number;
  level: AxisLevel;
  narrative: string;
  insight: string;
  layers: string[];
}

export interface PsychologicalProfile {
  name: string;
  axes: PsychologicalAxis[];
  dominantAxis: string;
  weakestAxis: string;
  overallBalance: number;
  summary: string;
}

function numOf(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function levelOf(score: number): AxisLevel {
  if (score >= 0.7) return 'مرتفع';
  if (score >= 0.45) return 'متوسط';
  return 'منخفض';
}

interface AxisContext {
  L: NameAnalysisLayers;
  rootNum: number | null;
  planetNum: number | null;
  signNum: number | null;
  houseNum: number | null;
  element: string;
}

interface AxisDef {
  id: string;
  title: string;
  icon: string;
  compute: (ctx: AxisContext, deps: AxisDeps) => { score: number; narrative: string; insight: string; layers: string[] };
}

interface AxisDeps {
  resonance: ResonanceEngine;
  schism: SchismEngine;
  temporal: TemporalAnalyzer;
}


const PLANET_NAME_TO_NUM: Record<string, number> = {
  'شمس': 1, 'الشمس': 1,
  'قمر': 2, 'القمر': 2,
  'عطارد': 3,
  'زهرة': 4, 'الزهرة': 4,
  'مريخ': 5, 'المريخ': 5,
  'مشتري': 6, 'المشتري': 6,
  'زحل': 7,
  'أورانوس': 8,
  'نبتون': 9,
  'بلوتو': 10,
};

const SIGN_NAME_TO_NUM: Record<string, number> = {
  'الحمل': 1, 'حمل': 1,
  'الثور': 2, 'ثور': 2,
  'الجوزاء': 3, 'جوزاء': 3,
  'السرطان': 4, 'سرطان': 4,
  'الأسد': 5, 'أسد': 5,
  'العذراء': 6, 'عذراء': 6,
  'الميزان': 7, 'ميزان': 7,
  'العقرب': 8, 'عقرب': 8,
  'القوس': 9, 'قوس': 9,
  'الجدي': 10, 'جدي': 10,
  'الدلو': 11, 'دلو': 11,
  'الحوت': 12, 'حوت': 12,
};

function resolvePlanetNum(value?: string): number | null {
  if (!value) return null;
  const direct = numOf(value);
  if (direct !== null) return direct;
  const clean = value.replace(/^ال/, '').trim();
  return PLANET_NAME_TO_NUM[value] ?? PLANET_NAME_TO_NUM[clean] ?? null;
}

function resolveSignNum(value?: string): number | null {
  if (!value) return null;
  const direct = numOf(value);
  if (direct !== null) return direct;
  const clean = value.replace(/^ال/, '').trim();
  return SIGN_NAME_TO_NUM[value] ?? SIGN_NAME_TO_NUM[clean] ?? null;
}

const ROOT_VIRTUES: Record<number, string> = {
  1: 'السيادة، الافتتاح، الانفراد',
  2: 'الثنائية، الاحتواء، الشراكة',
  3: 'الامتداد، البيان، الانتشار',
  4: 'البناء، النظام، الثبات',
  5: 'الحرية، التحول، الديناميكية',
  6: 'المسؤولية، الرعاية، الإصلاح',
  7: 'العمق، البحث، التحليل',
  8: 'التمكين، القوة، النفوذ',
  9: 'الخاتمة، الحكمة، الكمال',
};

const ELEMENT_DRIVES: Record<string, string> = {
  ناري: 'الاندفاع والحركة',
  ترابي: 'الثبات والبناء',
  هوائي: 'التواصل والتكيف',
  مائي: 'العمق والاحتواء',
};

const AXES: AxisDef[] = [
  {
    id: 'core_identity',
    title: 'الهوية الجوهرية',
    icon: '🪪',
    compute: (ctx) => {
      const root = ctx.rootNum ?? 0;
      const virtue = ROOT_VIRTUES[root] ?? 'غير محدد';
      return {
        score: root > 0 ? 0.85 : 0.3,
        narrative: `**الجذر ${root}** يمنحك جوهر **${virtue}**. هذه هي بذرة هويتك الأولى — منها تنبع سائر الطبقات.`,
        insight: `اعمل انطلاقاً من هذا الجوهر، لا ضده.`,
        layers: ['root'],
      };
    },
  },
  {
    id: 'driver_energy',
    title: 'الطاقة المحركة',
    icon: '⚡',
    compute: (ctx) => {
      const p = ctx.planetNum ?? 0;
      const map: Record<number, string> = {
        1: 'الشمس (الظهور، القيادة)',
        2: 'القمر (الحدس، الاحتواء)',
        3: 'عطارد (التواصل، الذكاء)',
        4: 'الزهرة (الجمال، القيمة)',
        5: 'المريخ (الفعل، الحسم)',
        6: 'المشتري (التوسع، الحكمة)',
        7: 'زحل (الانضباط، البناء)',
        8: 'أورانوس (التجديد، الثورة)',
        9: 'نبتون (الحدس، الروحانية)',
        10: 'بلوتو (التحول، القوة)',
      };
      const desc = map[p] ?? 'قوة غير محددة';
      return {
        score: p > 0 ? 0.8 : 0.35,
        narrative: `محرّكك الأساسي: **${desc}**. منه تستمد طاقتك اليومية وتحركاتك.`,
        insight: `وفّر بيئة تشغيل تدعم هذا المحرك — لا تعانده.`,
        layers: ['planet'],
      };
    },
  },
  {
    id: 'expression_style',
    title: 'أسلوب التعبير',
    icon: '🗣️',
    compute: (ctx) => {
      const s = ctx.signNum ?? 0;
      const signNames = ['الحمل','الثور','الجوزاء','السرطان','الأسد','العذراء','الميزان','العقرب','القوس','الجدي','الدلو','الحوت'];
      const name = signNames[(s - 1) % 12] ?? 'غير محدد';
      return {
        score: s > 0 ? 0.75 : 0.4,
        narrative: `أسلوبك الخارجي يظهر عبر **${name}** — هذه هي لغتك في التعبير عن نفسك للعالم.`,
        insight: `استخدم هذا الأسلوب كقناة رئيسية للتواصل.`,
        layers: ['sign'],
      };
    },
  },
  {
    id: 'practical_field',
    title: 'الميدان العملي',
    icon: '🎯',
    compute: (ctx) => {
      const h = ctx.houseNum ?? 0;
      const fields: Record<number, string> = {
        1: 'الذات والمظهر', 2: 'المال والقيمة', 3: 'التواصل والتعلم',
        4: 'العائلة والجذور', 5: 'الإبداع والفرح', 6: 'العمل والخدمة',
        7: 'الشراكة والعلاقات', 8: 'التحول والأزمات', 9: 'الحكمة والسفر',
        10: 'المهنة والمكانة', 11: 'الشبكات والآمال', 12: 'الباطن والعزلة',
      };
      const f = fields[h] ?? 'غير محدد';
      return {
        score: h > 0 ? 0.72 : 0.4,
        narrative: `ميدان تحقيقك الأمثل: **${f}**. هنا تجد تدفقك الطبيعي.`,
        insight: `اختر مشاريع في هذا الميدان لتحقيق أقصى إنجاز.`,
        layers: ['house'],
      };
    },
  },
  {
    id: 'material_nature',
    title: 'الطبع المادي',
    icon: '🔥',
    compute: (ctx) => {
      const e = ctx.element || 'غير محدد';
      const drive = ELEMENT_DRIVES[e] ?? 'غير محدد';
      return {
        score: ctx.element ? 0.85 : 0.3,
        narrative: `طبائعك: **${e}** — قوتك المادية في **${drive}**.`,
        insight: `استثمر هذه الطاقة في مجالات تُناسب طبعك.`,
        layers: ['element'],
      };
    },
  },
  {
    id: 'primary_shadow',
    title: 'الظل الأساسي',
    icon: '🌑',
    compute: (ctx, deps) => {
      if (!ctx.rootNum) return { score: 0.4, narrative: 'لا يوجد جذر.', insight: '-', layers: [] };
      const weak = deps.resonance.getWeakestForRoot(ctx.rootNum, 1);
      if (weak.length === 0) return { score: 0.5, narrative: 'لا يوجد ظل مرصود.', insight: '-', layers: [] };
      const w = weak[0];
      const partner = w.rootA === ctx.rootNum ? w.rootB : w.rootA;
      return {
        score: 1 - w.strength,
        narrative: `ظلك الأساسي يظهر مع الجذر ${partner}: **${w.entry.shadow}**`,
        insight: `الترياق: ${w.entry.remedy}`,
        layers: ['root', 'resonance'],
      };
    },
  },
  {
    id: 'interpersonal',
    title: 'العلاقات البينية',
    icon: '🤝',
    compute: (ctx, deps) => {
      if (!ctx.rootNum) return { score: 0.5, narrative: 'لا يوجد جذر.', insight: '-', layers: [] };
      const top = deps.resonance.getTopForRoot(ctx.rootNum, 3);
      const partners = top.map((r) => (r.rootA === ctx.rootNum ? r.rootB : r.rootA)).join('، ');
      const avg = top.reduce((s, r) => s + r.strength, 0) / (top.length || 1);
      return {
        score: avg,
        narrative: `أفضل تناغم مع الجذور: **${partners}** — علاقاتك تزدهر هنا.`,
        insight: `ابحث عن هؤلاء الشركاء في المشاريع الحياتية.`,
        layers: ['root', 'resonance'],
      };
    },
  },
  {
    id: 'internal_structure',
    title: 'البنية الداخلية',
    icon: '🏗️',
    compute: (ctx, deps) => {
      const s = deps.schism.evaluate({
        root: ctx.L.root,
        planet: ctx.L.planet,
        sign: ctx.L.sign,
        element: ctx.element,
      });
      return {
        score: s.coherence,
        narrative: `الانسجام البنيوي: **${(s.coherence * 100).toFixed(0)}%** — ${s.verdict}.`,
        insight: `الطبع الغالب: ${s.dominantElement} · المفقود: ${s.missingElement}`,
        layers: ['root', 'planet', 'sign', 'element'],
      };
    },
  },
  {
    id: 'blind_spot',
    title: 'النقطة العمياء',
    icon: '👁️',
    compute: (ctx, deps) => {
      const s = deps.schism.evaluate({
        root: ctx.L.root,
        planet: ctx.L.planet,
        sign: ctx.L.sign,
        element: ctx.element,
      });
      const missing = s.missingElement;
      const map: Record<string, string> = {
        'ناري': 'لا تجرؤ على المبادرة السريعة',
        'ترابي': 'لا تبني بشكل منتظم ومستمر',
        'هوائي': 'لا تتواصل بما يكفي',
        'مائي': 'لا تعترف بمشاعرك العميقة',
      };
      return {
        score: 0.4,
        narrative: `نقطتك العمياء: طبع **${missing}** غائب — **${map[missing] ?? 'غير محدد'}**.`,
        insight: s.remedy,
        layers: ['element'],
      };
    },
  },
  {
    id: 'temporal_rhythm',
    title: 'الإيقاع الزمني',
    icon: '📅',
    compute: (ctx, deps) => {
      if (!ctx.rootNum) return { score: 0.5, narrative: 'لا يوجد جذر.', insight: '-', layers: [] };
      const a = deps.temporal.analyzeRange(new Date(), ctx.rootNum, 28);
      const avg = a.calendar.reduce((s, d) => s + d.score, 0) / a.calendar.length;
      return {
        score: avg,
        narrative: `متوسط طاقة شهرك: **${(avg * 100).toFixed(0)}%** — ${a.peakDays.length} أيام ذروة، ${a.criticalDays.length} أيام تعبئة.`,
        insight: `استثمر أيام الذروة للمهام الكبرى، واحترم أيام التعبئة.`,
        layers: ['root', 'temporal'],
      };
    },
  },
  {
    id: 'hormonal_energy',
    title: 'الطاقة الهرمونية',
    icon: '🧬',
    compute: (ctx) => {
      if (!ctx.rootNum || !MEDICAL_ROOTS[ctx.rootNum]) {
        return { score: 0.5, narrative: 'لا توجد بيانات طبية.', insight: '-', layers: [] };
      }
      const m = MEDICAL_ROOTS[ctx.rootNum] as any;
      return {
        score: 0.78,
        narrative: `الناقل العصبي: **${m.neurotransmitter ?? 'غير محدد'}** · الغدة: **${m.gland ?? 'غير محدد'}**`,
        insight: `هرمون رئيسي: ${m.hormone ?? '—'}`,
        layers: ['root', 'medical'],
      };
    },
  },
  {
    id: 'vital_point',
    title: 'النقطة الحيوية',
    icon: '💊',
    compute: (ctx) => {
      if (!ctx.rootNum) return { score: 0.5, narrative: 'لا يوجد جذر.', insight: '-', layers: [] };
      const r = MEDICAL_REMAINDERS[ctx.rootNum] as any;
      if (!r) return { score: 0.5, narrative: 'لا يوجد باقي طبي.', insight: '-', layers: [] };
      return {
        score: 0.75,
        narrative: `منطقة الحيوية: **${r.organ ?? r.vitalPoint ?? 'غير محدد'}**`,
        insight: `الأعراض: ${r.symptoms ?? '—'}`,
        layers: ['root', 'medical'],
      };
    },
  },
  {
    id: 'failure_driver',
    title: 'محرك الفشل',
    icon: '⚠️',
    compute: (ctx) => {
      const e = ctx.element;
      const map: Record<string, string> = {
        'ناري': 'التسرع والاحتراق الداخلي',
        'ترابي': 'الجمود ومقاومة التغيير',
        'هوائي': 'التشتت والسطحية',
        'مائي': 'الغرق في المشاعر',
      };
      return {
        score: 0.55,
        narrative: `محرّك فشلك: **${map[e] ?? 'غير محدد'}**.`,
        insight: `اعمل على هذا الوعي في قراراتك.`,
        layers: ['element'],
      };
    },
  },
  {
    id: 'breach_gate',
    title: 'بوابة الاختراق',
    icon: '🚪',
    compute: (ctx, deps) => {
      if (!ctx.rootNum) return { score: 0.5, narrative: 'لا يوجد جذر.', insight: '-', layers: [] };
      const s = deps.schism.evaluate({
        root: ctx.L.root,
        planet: ctx.L.planet,
        sign: ctx.L.sign,
        element: ctx.element,
      });
      return {
        score: 0.6,
        narrative: `بوابة اختراقك (نقطة ضعفك الحرجة): **${s.missingElement}** غير مُعالج.`,
        insight: `الترياق: ${s.remedy}`,
        layers: ['element', 'schism'],
      };
    },
  },
  {
    id: 'unified_remedy',
    title: 'الترياق الشامل',
    icon: '💎',
    compute: (ctx, deps) => {
      const s = deps.schism.evaluate({
        root: ctx.L.root,
        planet: ctx.L.planet,
        sign: ctx.L.sign,
        element: ctx.element,
      });
      return {
        score: 0.82,
        narrative: `الترياق الشامل لك: **${s.remedy}**`,
        insight: `طبّق هذا أسبوعياً لمدة 90 يوماً وراقب الفرق.`,
        layers: ['element', 'schism'],
      };
    },
  },
];

export class PsychologicalAxesEngine {
  constructor(
    private resonance: ResonanceEngine = resonanceEngine,
    private schism: SchismEngine = schismEngine,
    private temporal: TemporalAnalyzer = temporalAnalyzer
  ) {}

  analyze(name: string, layers: NameAnalysisLayers): PsychologicalProfile {
    const ctx: AxisContext = {
      L: layers,
      rootNum: numOf(layers.root),
      planetNum: resolvePlanetNum(layers.planet),
      signNum: resolveSignNum(layers.sign),
      houseNum: numOf(layers.house),
      element: layers.element ?? '',
    };

    const deps: AxisDeps = {
      resonance: this.resonance,
      schism: this.schism,
      temporal: this.temporal,
    };

    const axes: PsychologicalAxis[] = AXES.map((def, i) => {
      const r = def.compute(ctx, deps);
      return {
        id: def.id,
        index: i + 1,
        title: def.title,
        icon: def.icon,
        score: Math.max(0, Math.min(1, r.score)),
        level: levelOf(r.score),
        narrative: r.narrative,
        insight: r.insight,
        layers: r.layers,
      };
    });

    const sorted = [...axes].sort((a, b) => b.score - a.score);
    const dominantAxis = sorted[0]?.title ?? '—';
    const weakestAxis = sorted[sorted.length - 1]?.title ?? '—';
    const overallBalance = axes.reduce((s, a) => s + a.score, 0) / axes.length;

    const summary = this.buildSummary(name, dominantAxis, weakestAxis, overallBalance);

    return {
      name,
      axes,
      dominantAxis,
      weakestAxis,
      overallBalance,
      summary,
    };
  }

  private buildSummary(name: string, dom: string, weak: string, avg: number): string {
    const pct = (avg * 100).toFixed(0);
    return [
      `**${name}** — الملف النفسي المتكامل`,
      '',
      `- **التوازن العام:** ${pct}%`,
      `- **أقوى محور:** ${dom}`,
      `- **أضعف محور:** ${weak}`,
      '',
      'هذا الملف يدمج 15 محوراً: من الجوهر والمحرك، عبر الظل والانسجام، إلى الترياق الشامل.',
    ].join('\n');
  }

  renderMarkdown(profile: PsychologicalProfile): string {
    const lines: string[] = [];
    lines.push(profile.summary);
    lines.push('');
    for (const axis of profile.axes) {
      lines.push(`### ${axis.icon} ${axis.index}. ${axis.title}`);
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
}

export const psychologicalAxesEngine = new PsychologicalAxesEngine();
