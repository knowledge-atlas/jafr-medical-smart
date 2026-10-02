import { AnalysisResult } from '../application/use-cases/AnalyzeNameUseCase';
import { ProductMeta } from './types';

export type DayQuality = 'ذروة' | 'جيد' | 'محايد' | 'منخفض' | 'تعبئة';

export interface DailyReading {
  date: string;              // YYYY-MM-DD
  dayIndex: number;          // 1..N من البداية
  mod7: number;              // 1..7
  mod12: number;             // 1..12
  mod28: number;             // 1..28
  quality: DayQuality;
  score: number;             // 0..1
  advice: string;
}

export interface TemporalOutput {
  meta: ProductMeta;
  name: string;
  startDate: string;
  days: number;
  peakDays: DailyReading[];
  lowDays: DailyReading[];
  calendar: DailyReading[];
  markdown: string;
}

const QUALITY_ADVICE: Record<DayQuality, string> = {
  ذروة: 'يوم مرتفع الطاقة — ابدأ المهام الكبرى واتخذ القرارات المهمة.',
  جيد: 'يوم داعم — مناسبة للتواصل والإنجاز المعتاد.',
  محايد: 'يوم متوازن — للترتيب والمراجعة والتخطيط.',
  منخفض: 'يوم منخفض الطاقة — تجنب القرارات المصيرية وخذ وقتاً للراحة.',
  تعبئة: 'يوم تعبئة — للقراءة والتأمل وإعادة الشحن.',
};

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function qualityOf(score: number): DayQuality {
  if (score >= 0.8) return 'ذروة';
  if (score >= 0.65) return 'جيد';
  if (score >= 0.45) return 'محايد';
  if (score >= 0.3) return 'منخفض';
  return 'تعبئة';
}

function mod(n: number, m: number): number {
  const r = n % m;
  return r === 0 ? m : r;
}

export class TemporalTracker {
  generate(
    analysis: AnalysisResult,
    startDate: Date = new Date(),
    days: number = 28
  ): TemporalOutput {
    if (analysis.status !== 'full' || !analysis.layers) {
      return this.abstainedOutput(analysis);
    }

    const root = this.numOf(analysis.layers.root) ?? 1;
    const planet = this.numOf(analysis.layers.planet) ?? 1;
    const sign = this.numOf(analysis.layers.sign) ?? 1;

    const calendar: DailyReading[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const m7 = mod(i + root, 7);
      const m12 = mod(i + planet, 12);
      const m28 = mod(i + sign, 28);

      // درجة تلاقٍ بين الدورات الثلاث
      const score =
        this.cycleScore(m7, 7) * 0.4 +
        this.cycleScore(m12, 12) * 0.3 +
        this.cycleScore(m28, 28) * 0.3;

      const quality = qualityOf(score);
      calendar.push({
        date: toDateString(d),
        dayIndex: i + 1,
        mod7: m7,
        mod12: m12,
        mod28: m28,
        quality,
        score,
        advice: QUALITY_ADVICE[quality],
      });
    }

    const peakDays = [...calendar]
      .filter((d) => d.quality === 'ذروة')
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);

    const lowDays = [...calendar]
      .filter((d) => d.quality === 'منخفض' || d.quality === 'تعبئة')
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    const meta: ProductMeta = {
      productId: 'temporal-tracker',
      productName: 'المتتبع الزمني',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };

    return {
      meta,
      name: analysis.name,
      startDate: toDateString(startDate),
      days,
      peakDays,
      lowDays,
      calendar,
      markdown: this.renderMarkdown(analysis.name, calendar, peakDays, lowDays),
    };
  }

  private cycleScore(value: number, cycle: number): number {
    // القيم الوسطى في كل دورة أعلى طاقة
    const mid = cycle / 2;
    const dist = Math.abs(value - mid);
    return Math.max(0.15, 1 - dist / mid);
  }

  private numOf(id?: string): number | null {
    if (!id) return null;
    const m = id.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  private abstainedOutput(a: AnalysisResult): TemporalOutput {
    const meta: ProductMeta = {
      productId: 'temporal-tracker',
      productName: 'المتتبع الزمني',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };
    return {
      meta,
      name: a.name,
      startDate: toDateString(new Date()),
      days: 0,
      peakDays: [],
      lowDays: [],
      calendar: [],
      markdown: `# المتتبع الزمني\n\nتعذّر بناء التقويم لأن النظام امتنع عن تحليل الاسم.`,
    };
  }

  private renderMarkdown(
    name: string,
    calendar: DailyReading[],
    peaks: DailyReading[],
    lows: DailyReading[]
  ): string {
    const lines: string[] = [];
    lines.push(`# 📅 المتتبع الزمني — ${name}`);
    lines.push('');
    lines.push(`**فترة التتبع:** ${calendar.length} يوماً.`);
    lines.push('');
    lines.push('## 🌟 أيام الذروة');
    lines.push('');
    peaks.forEach((d) => {
      lines.push(`- **${d.date}** (${(d.score * 100).toFixed(0)}%) — ${d.advice}`);
    });
    lines.push('');
    lines.push('## ⚠️ أيام التعبئة');
    lines.push('');
    lows.forEach((d) => {
      lines.push(`- **${d.date}** (${(d.score * 100).toFixed(0)}%) — ${d.advice}`);
    });
    lines.push('');
    lines.push('## 📊 التقويم الكامل');
    lines.push('');
    lines.push('| التاريخ | mod7 | mod12 | mod28 | الجودة |');
    lines.push('|---------|------|-------|-------|--------|');
    calendar.forEach((d) => {
      lines.push(`| ${d.date} | ${d.mod7} | ${d.mod12} | ${d.mod28} | ${d.quality} |`);
    });
    lines.push('');
    lines.push('> هذا تقويم نمطي للتأمل، لا تنبؤ قاطع.');
    return lines.join('\n');
  }
}
