import { REMAINDERS_FULL_TEXT } from '../../data/remainders';

export type DayQuality = 'ذروة' | 'جيد' | 'محايد' | 'منخفض' | 'تعبئة';

export interface DayReading {
  date: string;
  dayIndex: number;
  mod9: number;
  mod7: number;
  mod12: number;
  mod28: number;
  quality: DayQuality;
  score: number;
  rootRemainder: number;
  rootText: string;
  advice: string;
}

export interface TemporalAnalysis {
  startDate: string;
  days: number;
  rootNum: number;
  peakDays: DayReading[];
  criticalDays: DayReading[];
  calendar: DayReading[];
  summary: string;
}

const ADVICE_BY_QUALITY: Record<DayQuality, string> = {
  ذروة: '🌟 يوم ذروة — بادر بالمهام الكبرى واتخذ القرارات المصيرية.',
  جيد: '✨ يوم داعم — مناسب للتواصل والإنجاز المعتاد.',
  محايد: '⚖️ يوم متوازن — للترتيب والمراجعة والتخطيط.',
  منخفض: '⚠️ يوم منخفض الطاقة — تجنب القرارات المصيرية واسترح.',
  تعبئة: '💤 يوم تعبئة — للتأمل والقراءة وإعادة الشحن.',
};

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mod(n: number, m: number): number {
  const r = n % m;
  return r === 0 ? m : r;
}

function qualityOf(score: number): DayQuality {
  if (score >= 0.78) return 'ذروة';
  if (score >= 0.62) return 'جيد';
  if (score >= 0.45) return 'محايد';
  if (score >= 0.30) return 'منخفض';
  return 'تعبئة';
}

function extractSummary(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('النص النهائي')) {
      return line.replace(/^النص النهائي[^:]*:\s*/, '').trim();
    }
  }
  return lines[0] ?? '';
}

function extractRemedy(text: string): string {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('الترياق')) {
      return line.replace(/^الترياق[^:]*:\s*/, '').trim();
    }
  }
  return '';
}

export class TemporalAnalyzer {
  analyzeDay(date: Date, rootNum: number, dayIndex: number): DayReading {
    const m9 = mod(rootNum + dayIndex, 9);
    const m7 = mod(rootNum + dayIndex, 7);
    const m12 = mod(rootNum + dayIndex, 12);
    const m28 = mod(rootNum + dayIndex, 28);

    // وزن الجذر (mod9) الأقوى: يقيس التوافق مع الجذر الشخصي
    const rootDistance = Math.abs(m9 - rootNum);
    const rootScore = Math.max(0, 1 - rootDistance / 4.5);

    // mod7 (السر): الأيام 1، 4، 6، 9 = أصول/قواعد/موازنات
    const favourable7 = [1, 4, 6, 9];
    const score7 = favourable7.includes(m7) ? 0.85 : 0.5;

    // mod12 (البرج): الأيام الحاكمة (1، 4، 7، 10)
    const favourable12 = [1, 4, 7, 10];
    const score12 = favourable12.includes(m12) ? 0.8 : 0.5;

    // mod28 (الحرف): أيام قوية (1، 5، 13، 21)
    const favourable28 = [1, 5, 13, 21];
    const score28 = favourable28.includes(m28) ? 0.8 : 0.5;

    const score =
      rootScore * 0.45 +
      score7 * 0.20 +
      score12 * 0.20 +
      score28 * 0.15;

    const quality = qualityOf(score);
    const rootText = REMAINDERS_FULL_TEXT[m9] ?? '';
    const summaryText = extractSummary(rootText);
    const remedy = extractRemedy(rootText);

    const advice = [
      ADVICE_BY_QUALITY[quality],
      summaryText ? `📌 ${summaryText}` : '',
      remedy ? `💊 الترياق: ${remedy}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      date: toDateString(date),
      dayIndex,
      mod9: m9,
      mod7: m7,
      mod12: m12,
      mod28: m28,
      quality,
      score,
      rootRemainder: m9,
      rootText,
      advice,
    };
  }

  analyzeRange(startDate: Date, rootNum: number, days: number = 28): TemporalAnalysis {
    const calendar: DayReading[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      calendar.push(this.analyzeDay(d, rootNum, i));
    }

    const peakDays = [...calendar]
      .filter((d) => d.quality === 'ذروة')
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);

    const criticalDays = [...calendar]
      .filter((d) => d.quality === 'منخفض' || d.quality === 'تعبئة')
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    const avgScore = calendar.reduce((s, d) => s + d.score, 0) / calendar.length;
    const summary = this.buildSummary(avgScore, peakDays.length, criticalDays.length);

    return {
      startDate: toDateString(startDate),
      days,
      rootNum,
      peakDays,
      criticalDays,
      calendar,
      summary,
    };
  }

  private buildSummary(avg: number, peaks: number, criticals: number): string {
    const pct = (avg * 100).toFixed(0);
    const lines: string[] = [`**متوسط طاقة الفترة:** ${pct}%`];
    if (peaks > 0) lines.push(`- **${peaks}** يوماً في الذروة — استثمرها للمهام الكبرى.`);
    if (criticals > 0) lines.push(`- **${criticals}** يوماً منخفضة — خصصها للراحة والتأمل.`);
    lines.push('- الفترة مثالية لتطبيق توصيات التقرير العميق.');
    return lines.join('\n');
  }

  /** يُرجع 3 أيام الأقوى في نطاق */
  topDays(analysis: TemporalAnalysis, limit: number = 3): DayReading[] {
    return [...analysis.calendar].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /** يُرجع 3 أيام الأضعف في نطاق */
  bottomDays(analysis: TemporalAnalysis, limit: number = 3): DayReading[] {
    return [...analysis.calendar].sort((a, b) => a.score - b.score).slice(0, limit);
  }

  /** يُرجع نصائح مخصصة لليوم الحالي */
  today(rootNum: number, dayIndex: number): DayReading {
    return this.analyzeDay(new Date(), rootNum, dayIndex);
  }
}

export const temporalAnalyzer = new TemporalAnalyzer();
