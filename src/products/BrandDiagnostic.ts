import { AnalysisResult } from '../application/use-cases/AnalyzeNameUseCase';
import { ProductMeta } from './types';
import { describeBrand } from './BrandHints';

export interface BrandDimension {
  id: string;
  label: string;
  score: number;
  level: 'قوي' | 'متوسط' | 'ضعيف';
  note: string;
}

export interface BrandAlternative {
  name: string;
  rationale: string;
  projectedScore: number;
}

export interface BrandDiagnosticOutput {
  meta: ProductMeta;
  brandName: string;
  overallScore: number;
  overallLevel: 'قوي' | 'متوسط' | 'ضعيف';
  dimensions: BrandDimension[];
  alternatives: BrandAlternative[];
  markdown: string;
}

const STRONG_CONSONANTS = ['م', 'ق', 'ط', 'ب', 'ر', 'ص', 'ع', 'ن'];
const SOFT_CONSONANTS = ['س', 'ه', 'ي', 'و', 'ل', 'ف', 'ح'];
const HARD_CONSONANTS = ['خ', 'غ', 'ض', 'ظ', 'ذ', 'ث'];

function num(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function countMatches(text: string, set: string[]): number {
  let c = 0;
  for (const ch of text) if (set.includes(ch)) c++;
  return c;
}

function levelOf(score: number, kind: 'brand' = 'brand'): 'قوي' | 'متوسط' | 'ضعيف' {
  if (score >= 0.7) return 'قوي';
  if (score >= 0.45) return 'متوسط';
  return 'ضعيف';
}

export class BrandDiagnostic {
  analyze(brandAnalysis: AnalysisResult, activity?: string): BrandDiagnosticOutput {
    if (brandAnalysis.status !== 'full') {
      return this.abstainedOutput(brandAnalysis);
    }

    const dimensions: BrandDimension[] = [
      this.pronunciationDim(brandAnalysis.name),
      this.memorabilityDim(brandAnalysis.name),
      this.energyDim(brandAnalysis),
      this.consistencyDim(brandAnalysis),
      this.differentiationDim(brandAnalysis),
      this.activityFitDim(brandAnalysis, activity),
    ];

    const overallScore =
      dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
    const overallLevel = levelOf(overallScore);

    const alternatives = this.generateAlternatives(
      brandAnalysis.name,
      brandAnalysis.layers?.element,
      overallScore
    );

    const meta: ProductMeta = {
      productId: 'brand-diagnostic',
      productName: 'التشخيص التجاري',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };

    return {
      meta,
      brandName: brandAnalysis.name,
      overallScore,
      overallLevel,
      dimensions,
      alternatives,
      markdown: this.renderMarkdown(
        brandAnalysis.name,
        activity,
        overallScore,
        overallLevel,
        dimensions,
        alternatives
      ),
    };
  }

  private abstainedOutput(a: AnalysisResult): BrandDiagnosticOutput {
    const meta: ProductMeta = {
      productId: 'brand-diagnostic',
      productName: 'التشخيص التجاري',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };
    return {
      meta,
      brandName: a.name,
      overallScore: 0,
      overallLevel: 'ضعيف',
      dimensions: [],
      alternatives: [],
      markdown: `# التشخيص التجاري\n\nتعذّر التحليل لأن النظام امتنع عن معالجة هذا الاسم.`,
    };
  }

  private pronunciationDim(name: string): BrandDimension {
    const strong = countMatches(name, STRONG_CONSONANTS);
    const soft = countMatches(name, SOFT_CONSONANTS);
    const hard = countMatches(name, HARD_CONSONANTS);
    const total = name.length || 1;
    const score = Math.max(0, Math.min(1, (strong + soft * 0.7 - hard * 0.5) / total + 0.3));
    return {
      id: 'pronunciation',
      label: 'سهولة النطق',
      score,
      level: levelOf(score),
      note: `حروف قوية: ${strong}، ناعمة: ${soft}، ثقيلة: ${hard}`,
    };
  }

  private memorabilityDim(name: string): BrandDimension {
    const len = name.replace(/\s/g, '').length;
    let score = 1;
    if (len <= 3) score = 0.9;
    else if (len <= 5) score = 0.95;
    else if (len <= 7) score = 0.75;
    else score = 0.5;
    return {
      id: 'memorability',
      label: 'قابلية الحفظ',
      score,
      level: levelOf(score),
      note: `عدد الحروف (بلا مسافات): ${len}`,
    };
  }

  private energyDim(a: AnalysisResult): BrandDimension {
    const el = a.layers?.element ?? '';
    const map: Record<string, number> = {
      ناري: 0.9,
      هوائي: 0.8,
      ترابي: 0.7,
      مائي: 0.6,
    };
    const score = map[el] ?? 0.5;
    return {
      id: 'energy',
      label: 'الطاقة الطبائعية',
      score,
      level: levelOf(score),
      note: `الطبع: ${el || 'غير محدد'}`,
    };
  }

  private consistencyDim(a: AnalysisResult): BrandDimension {
    const keys: Array<'root' | 'planet' | 'sign' | 'element'> = ['root', 'planet', 'sign', 'element'];
    const present = keys.filter((k) => a.layers?.[k]).length;
    const score = present / keys.length;
    return {
      id: 'consistency',
      label: 'اتساق الطبقات',
      score,
      level: levelOf(score),
      note: `${present} من ${keys.length} طبقات ظاهرة`,
    };
  }

  private differentiationDim(a: AnalysisResult): BrandDimension {
    const r = num(a.layers?.root);
    const p = num(a.layers?.planet);
    const s = num(a.layers?.sign);
    const unique = new Set([r, p, s].filter((x) => x !== null)).size;
    const score = Math.min(1, unique / 3 * 0.9 + 0.1);
    return {
      id: 'differentiation',
      label: 'التمايز',
      score,
      level: levelOf(score),
      note: `تنوع الأرقام عبر الطبقات: ${unique}/3`,
    };
  }

  private activityFitDim(a: AnalysisResult, activity?: string): BrandDimension {
    if (!activity) {
      return {
        id: 'fit',
        label: 'ملاءمة النشاط',
        score: 0.6,
        level: 'متوسط',
        note: 'لم يُحدد النشاط',
      };
    }
    const el = a.layers?.element ?? '';
    const techKeywords = /تقنية|برمجة|تطبيق|ذكاء|رقمي|سوفت|تكنولوجيا/;
    const foodKeywords = /مطعم|طعام|مقهى|حلويات|بقالة/;
    const fashionKeywords = /أزياء|موضة|ملابس|جمال/;
    let score = 0.6;
    if (techKeywords.test(activity) && (el === 'ناري' || el === 'هوائي')) score = 0.9;
    if (foodKeywords.test(activity) && (el === 'ترابي' || el === 'مائي')) score = 0.9;
    if (fashionKeywords.test(activity) && (el === 'هوائي' || el === 'ناري')) score = 0.85;
    return {
      id: 'fit',
      label: 'ملاءمة النشاط',
      score,
      level: levelOf(score),
      note: `النشاط "${activity}" مع طبع ${el || '—'}`,
    };
  }

  private generateAlternatives(
    original: string,
    element: string | undefined,
    baseline: number
  ): BrandAlternative[] {
    const alts: BrandAlternative[] = [];
    const suffixes: Record<string, string[]> = {
      ناري: ['برايت', 'نوفا', 'فلكس'],
      ترابي: ['ثبات', 'رسوخ', 'أصل'],
      هوائي: ['نسيم', 'رقي', 'صفاء'],
      مائي: ['عمق', 'مدى', 'صفو'],
    };
    const pool = suffixes[element ?? ''] ?? ['بلس', 'برو', 'لاين'];

    // بديل 1: الأصل + لاحقة قصيرة
    alts.push({
      name: `${original} ${pool[0]}`,
      rationale: 'إضافة كلمة قصيرة تُعزز التمايز دون فقدان الهوية.',
      projectedScore: Math.min(1, baseline + 0.05),
    });

    // بديل 2: مزج مع كلمة ذات طاقة مشابهة
    alts.push({
      name: `${pool[1] ?? 'نوفا'} ${original}`,
      rationale: 'تقديم كلمة طاقة أمام الاسم لمنحه ثقلاً بَصَرياً.',
      projectedScore: Math.min(1, baseline + 0.03),
    });

    // بديل 3: تخفيف الطبع
    alts.push({
      name: `${original}${element === 'ناري' ? 'يا' : 'م'}`,
      rationale: 'تخفيف موسيقي للاسم لتسهيل النداء والتسويق الشفهي.',
      projectedScore: Math.min(1, baseline + 0.02),
    });

    return alts;
  }

  private renderMarkdown(
    brand: string,
    activity: string | undefined,
    overall: number,
    level: string,
    dims: BrandDimension[],
    alts: BrandAlternative[]
  ): string {
    const pct = (overall * 100).toFixed(0);
    const lines: string[] = [];

    // ─── الرأس ───
    lines.push(`# 🏷️ التشخيص التجاري — ${brand}`);
    if (activity) {
      lines.push('');
      lines.push(`> **النشاط:** ${activity}`);
    }
    lines.push('');
    lines.push(`**النتيجة الإجمالية:** ${pct}% — تصنيف: **${level}**`);
    lines.push('');
    lines.push('> كل بُعد مشروح بالتفصيل — مع تفسير النتيجة وتوصية عملية.');
    lines.push('');
    lines.push('---');
    lines.push('');

    // ─── الأبعاد مع الشرح ───
    for (let i = 0; i < dims.length; i++) {
      const d = dims[i];
      lines.push(`## ${i + 1}. ${d.label}`);
      lines.push('');
      lines.push(`**النتيجة:** ${(d.score * 100).toFixed(0)}% — **${d.level}**`);
      lines.push('');

      const hint = describeBrand(d.id, d.score);
      if (hint) {
        lines.push(`**📖 ما هذا البُعد؟**`);
        lines.push('');
        lines.push(hint.description);
        lines.push('');
        lines.push(`**🎯 ماذا يعني هذا لعلامتك؟**`);
        lines.push('');
        lines.push(hint.interpretation);
        lines.push('');
        lines.push(`**💡 التوصية:**`);
        lines.push('');
        lines.push(hint.recommendation);
        lines.push('');
      }

      lines.push(`**📊 تفاصيل:** ${d.note}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // ─── البدائل ───
    lines.push('## 🌟 بدائل مقترحة');
    lines.push('');
    lines.push('> أسماء بديلة يمكن اختبارها ميدانياً قبل أي قرار.');
    lines.push('');
    alts.forEach((a, i) => {
      lines.push(`### البديل ${i + 1}: **${a.name}** (${(a.projectedScore * 100).toFixed(0)}%)`);
      lines.push('');
      lines.push(`- **المنطق:** ${a.rationale}`);
      lines.push('');
    });
    lines.push('---');
    lines.push('');

    // ─── الخلاصة ───
    lines.push('## 📌 الخلاصة العملية');
    lines.push('');
    const strong = dims.filter((d) => d.score >= 0.7);
    const weak = dims.filter((d) => d.score < 0.45);

    if (strong.length > 0) {
      lines.push('**✅ نقاط القوة:**');
      lines.push('');
      strong.forEach((d) => lines.push(`- **${d.label}** (${(d.score * 100).toFixed(0)}%)`));
      lines.push('');
    }
    if (weak.length > 0) {
      lines.push('**⚠️ نقاط تحتاج تحسيناً:**');
      lines.push('');
      weak.forEach((d) => lines.push(`- **${d.label}** (${(d.score * 100).toFixed(0)}%)`));
      lines.push('');
    }

    lines.push('> هذا تشخيص لغوي-نمطي، وليس ضماناً تجارياً. القرار النهائي يعود لصاحب المشروع.');

    return lines.join('\n');
  }
}
