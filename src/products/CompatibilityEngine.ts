import { AnalysisResult } from '../application/use-cases/AnalyzeNameUseCase';
import { ProductMeta } from './types';
import { ResonanceEngine, resonanceEngine } from '../domain/services/ResonanceEngine';

export interface CompatibilityDimension {
  id: string;
  label: string;
  score: number;
  level: 'مرتفع' | 'متوسط' | 'منخفض';
  note: string;
}

export interface CompatibilityOutput {
  meta: ProductMeta;
  nameA: string;
  nameB: string;
  overallScore: number;
  overallLevel: 'مرتفع' | 'متوسط' | 'منخفض';
  dimensions: CompatibilityDimension[];
  markdown: string;
  resonanceNote?: string;
}

const ELEMENT_MATRIX: Record<string, Record<string, number>> = {
  ناري: { ناري: 0.85, هوائي: 0.9, ترابي: 0.5, مائي: 0.35 },
  هوائي: { ناري: 0.9, هوائي: 0.85, ترابي: 0.35, مائي: 0.5 },
  ترابي: { ناري: 0.5, هوائي: 0.35, ترابي: 0.85, مائي: 0.9 },
  مائي: { ناري: 0.35, هوائي: 0.5, ترابي: 0.9, مائي: 0.85 },
};

function num(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function linearDistance(a: number, b: number, max: number): number {
  return Math.max(0, 1 - Math.abs(a - b) / max);
}

function circularDistance(a: number, b: number, cycle: number): number {
  const diff = Math.abs(a - b);
  const dist = Math.min(diff, cycle - diff);
  return Math.max(0, 1 - dist / (cycle / 2));
}

function levelOf(score: number): 'مرتفع' | 'متوسط' | 'منخفض' {
  if (score >= 0.75) return 'مرتفع';
  if (score >= 0.5) return 'متوسط';
  return 'منخفض';
}

export class CompatibilityEngine {
  constructor(private resonance: ResonanceEngine = resonanceEngine) {}

  compare(a: AnalysisResult, b: AnalysisResult): CompatibilityOutput {
    if (a.status !== 'full' || b.status !== 'full') {
      return this.abstainedOutput(a, b);
    }

    const dimensions: CompatibilityDimension[] = [
      this.elementDim(a, b),
      this.planetDim(a, b),
      this.signDim(a, b),
      this.rootDim(a, b),
      this.confidenceDim(a, b),
      this.layerAgreementDim(a, b),
      this.complementarityDim(a, b),
    ];

    const overallScore = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
    const overallLevel = levelOf(overallScore);

    const meta: ProductMeta = {
      productId: 'compatibility-engine',
      productName: 'محرك التوافق',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };

    return {
      meta, nameA: a.name, nameB: b.name,
      overallScore, overallLevel, dimensions,
      markdown: this.renderMarkdown(a.name, b.name, overallScore, overallLevel, dimensions),
    };
  }

  analyzeDeep(a: AnalysisResult, b: AnalysisResult): CompatibilityOutput {
    if (a.status !== 'full' || b.status !== 'full') {
      return this.abstainedOutput(a, b);
    }

    const rA = num(a.layers?.root);
    const rB = num(b.layers?.root);
    const resonance = rA !== null && rB !== null ? this.resonance.get(rA, rB) : null;

    const dimensions: CompatibilityDimension[] = [
      this.resonanceDim(resonance),
      this.elementDim(a, b),
      this.planetDim(a, b),
      this.signDim(a, b),
      this.confidenceDim(a, b),
      this.layerAgreementDim(a, b),
      this.complementarityDim(a, b),
      this.shadowAwarenessDim(resonance),
    ];

    const overallScore = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
    const overallLevel = levelOf(overallScore);

    const meta: ProductMeta = {
      productId: 'compatibility-engine',
      productName: 'محرك التوافق المتقدم',
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };

    const resonanceNote = resonance
      ? `${resonance.entry.description}\n\n**الظل:** ${resonance.entry.shadow}\n\n**الترياق:** ${resonance.entry.remedy}`
      : undefined;

    return {
      meta, nameA: a.name, nameB: b.name,
      overallScore, overallLevel, dimensions, resonanceNote,
      markdown: this.renderMarkdownDeep(a.name, b.name, overallScore, overallLevel, dimensions, resonanceNote),
    };
  }

  private abstainedOutput(a: AnalysisResult, b: AnalysisResult): CompatibilityOutput {
    const meta: ProductMeta = {
      productId: 'compatibility-engine',
      productName: 'محرك التوافق',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };
    return {
      meta, nameA: a.name, nameB: b.name,
      overallScore: 0, overallLevel: 'منخفض', dimensions: [],
      markdown: `# تحليل التوافق\n\nلا يمكن إجراء المقارنة لأن أحد الاسمين امتنع النظام عن تحليله.`,
    };
  }

  private resonanceDim(r: ReturnType<ResonanceEngine['get']>): CompatibilityDimension {
    if (!r) {
      return { id: 'resonance', label: 'الرنين الحقيقي (نص البوني)', score: 0.5, level: 'متوسط', note: 'لا تتوفر بيانات رنين' };
    }
    return {
      id: 'resonance', label: 'الرنين الحقيقي (نص البوني)',
      score: r.strength, level: levelOf(r.strength),
      note: `${r.key}: ${r.entry.description}`,
    };
  }

  private shadowAwarenessDim(r: ReturnType<ResonanceEngine['get']>): CompatibilityDimension {
    if (!r) {
      return { id: 'shadow', label: 'الوعي بالظل', score: 0.5, level: 'متوسط', note: 'لا توجد بيانات' };
    }
    const shadowIntensity = r.entry.shadow.length > 30 ? 0.5 : 0.7;
    return {
      id: 'shadow', label: 'الوعي بالظل والترياق',
      score: shadowIntensity, level: levelOf(shadowIntensity),
      note: `الظل: ${r.entry.shadow} — الترياق: ${r.entry.remedy}`,
    };
  }

  private elementDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const ea = a.layers?.element ?? '';
    const eb = b.layers?.element ?? '';
    const score = ELEMENT_MATRIX[ea]?.[eb] ?? 0.5;
    return { id: 'element', label: 'تناغم الطبائع', score, level: levelOf(score), note: `طبع ${ea || '—'} مع طبع ${eb || '—'}` };
  }

  private planetDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const pa = num(a.layers?.planet);
    const pb = num(b.layers?.planet);
    if (pa === null || pb === null) return { id: 'planet', label: 'تناغم الكواكب', score: 0.5, level: 'متوسط', note: 'بيانات ناقصة' };
    const score = linearDistance(pa, pb, 10);
    return { id: 'planet', label: 'تناغم الكواكب', score, level: levelOf(score), note: `كوكب ${pa} مع كوكب ${pb}` };
  }

  private signDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const sa = num(a.layers?.sign);
    const sb = num(b.layers?.sign);
    if (sa === null || sb === null) return { id: 'sign', label: 'تناغم الأبراج', score: 0.5, level: 'متوسط', note: 'بيانات ناقصة' };
    const score = circularDistance(sa, sb, 12);
    return { id: 'sign', label: 'تناغم الأبراج', score, level: levelOf(score), note: `برج ${sa} مع برج ${sb}` };
  }

  private rootDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const ra = num(a.layers?.root);
    const rb = num(b.layers?.root);
    if (ra === null || rb === null) return { id: 'root', label: 'تجانس الجذور', score: 0.5, level: 'متوسط', note: 'بيانات ناقصة' };
    const score = linearDistance(ra, rb, 9);
    return { id: 'root', label: 'تجانس الجذور', score, level: levelOf(score), note: `جذر ${ra} مع جذر ${rb}` };
  }

  private confidenceDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const diff = Math.abs(a.confidence.overall - b.confidence.overall);
    const score = Math.max(0, 1 - diff);
    return { id: 'confidence', label: 'توازن الثقة', score, level: levelOf(score), note: `فرق ${(diff * 100).toFixed(0)}%` };
  }

  private layerAgreementDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const keys: Array<'root' | 'planet' | 'sign' | 'element'> = ['root', 'planet', 'sign', 'element'];
    const same = keys.filter((k) => a.layers?.[k] && a.layers?.[k] === b.layers?.[k]).length;
    const score = same / keys.length;
    return { id: 'agreement', label: 'اتفاق الطبقات', score, level: levelOf(score), note: `${same} من ${keys.length} متطابقة` };
  }

  private complementarityDim(a: AnalysisResult, b: AnalysisResult): CompatibilityDimension {
    const ea = a.layers?.element ?? '';
    const eb = b.layers?.element ?? '';
    const isComplementary =
      (ea === 'ناري' && eb === 'هوائي') || (ea === 'هوائي' && eb === 'ناري') ||
      (ea === 'ترابي' && eb === 'مائي') || (ea === 'مائي' && eb === 'ترابي');
    const score = isComplementary ? 0.95 : 0.6;
    return { id: 'complementarity', label: 'التكامل الطبائعي', score, level: levelOf(score), note: isComplementary ? 'متكاملان' : 'محايدان' };
  }

  private renderMarkdown(a: string, b: string, overall: number, level: string, dims: CompatibilityDimension[]): string {
    const pct = (overall * 100).toFixed(0);
    const lines: string[] = [];
    lines.push(`# 💞 تقرير التوافق — ${a} × ${b}`);
    lines.push('');
    lines.push(`**النتيجة الإجمالية:** ${pct}% — تصنيف: ${level}`);
    lines.push('');
    for (const d of dims) {
      lines.push(`### ${d.label}`);
      lines.push(`- النتيجة: **${(d.score * 100).toFixed(0)}%** (${d.level})`);
      lines.push(`- ${d.note}`);
      lines.push('');
    }
    lines.push('> هذا تحليل نمطي، وليس حكماً على العلاقة.');
    return lines.join('\n');
  }

  private renderMarkdownDeep(a: string, b: string, overall: number, level: string, dims: CompatibilityDimension[], resonanceNote?: string): string {
    const pct = (overall * 100).toFixed(0);
    const lines: string[] = [];
    lines.push(`# 💞 تقرير التوافق المتقدم — ${a} × ${b}`);
    lines.push('');
    lines.push(`**النتيجة الإجمالية:** ${pct}% — تصنيف: **${level}**`);
    lines.push('');
    lines.push('---');
    lines.push('');
    for (const d of dims) {
      lines.push(`### ${d.label}`);
      lines.push(`- النتيجة: **${(d.score * 100).toFixed(0)}%** (${d.level})`);
      lines.push(`- ${d.note}`);
      lines.push('');
    }
    if (resonanceNote) {
      lines.push('---');
      lines.push('');
      lines.push('## 🌟 الرنين من نص البوني');
      lines.push('');
      lines.push(resonanceNote);
      lines.push('');
    }
    lines.push('> هذا تحليل نمطي، وليس حكماً على العلاقة.');
    return lines.join('\n');
  }
}
