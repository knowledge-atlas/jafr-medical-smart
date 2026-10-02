import { ProductMeta } from './types';

export type RemedyFrequency = 'daily' | 'weekly' | 'monthly';

export interface Remedy {
  id: string;
  title: string;
  description: string;
  frequency: RemedyFrequency;
  targetCount: number;      // في الأسبوع/الشهر
  createdAt: string;
}

export interface RemedyLogEntry {
  remedyId: string;
  date: string;             // YYYY-MM-DD
  done: boolean;
}

export interface RemedyProgress {
  remedy: Remedy;
  completed: number;
  target: number;
  adherenceRate: number;    // 0..1
  streak: number;
  lastDone: string | null;
  status: 'ملتزم' | 'متذبذب' | 'متوقف';
}

export interface RemedyTrackerOutput {
  meta: ProductMeta;
  userName: string;
  remedies: Remedy[];
  logs: RemedyLogEntry[];
  progress: RemedyProgress[];
  overallAdherence: number;
  markdown: string;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.abs(Math.floor((t2 - t1) / 86400000));
}

export class RemedyTracker {
  addRemedy(
    remedies: Remedy[],
    title: string,
    description: string,
    frequency: RemedyFrequency = 'daily',
    targetCount: number = 7
  ): Remedy[] {
    const remedy: Remedy = {
      id: `remedy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      frequency,
      targetCount,
      createdAt: new Date().toISOString(),
    };
    return [...remedies, remedy];
  }

  log(
    logs: RemedyLogEntry[],
    remedyId: string,
    done: boolean,
    date: Date = new Date()
  ): RemedyLogEntry[] {
    const dateStr = toDateString(date);
    const filtered = logs.filter(
      (l) => !(l.remedyId === remedyId && l.date === dateStr)
    );
    return [...filtered, { remedyId, date: dateStr, done }];
  }

  generateReport(
    userName: string,
    remedies: Remedy[],
    logs: RemedyLogEntry[],
    today: Date = new Date()
  ): RemedyTrackerOutput {
    const progress: RemedyProgress[] = remedies.map((r) =>
      this.computeProgress(r, logs, today)
    );

    const overallAdherence =
      progress.length > 0
        ? progress.reduce((s, p) => s + p.adherenceRate, 0) / progress.length
        : 0;

    const meta: ProductMeta = {
      productId: 'remedy-tracker',
      productName: 'متتبع الالتزام',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      offline: true,
    };

    return {
      meta,
      userName,
      remedies,
      logs,
      progress,
      overallAdherence,
      markdown: this.renderMarkdown(userName, progress, overallAdherence),
    };
  }

  private computeProgress(
    r: Remedy,
    logs: RemedyLogEntry[],
    today: Date
  ): RemedyProgress {
    const myLogs = logs.filter((l) => l.remedyId === r.id && l.done);
    const completed = myLogs.length;

    const adherenceRate = Math.min(1, completed / Math.max(1, r.targetCount));

    // أعلى سلسلة متتالية
    const sortedDates = myLogs
      .map((l) => l.date)
      .sort((a, b) => a.localeCompare(b));

    let bestStreak = 0;
    let currentStreak = 0;
    let prev: string | null = null;
    for (const d of sortedDates) {
      if (prev === null || daysBetween(prev, d) === 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      prev = d;
    }

    const lastDone = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
    const todayStr = toDateString(today);
    const daysSinceLast = lastDone ? daysBetween(lastDone, todayStr) : Infinity;

    let status: RemedyProgress['status'];
    if (adherenceRate >= 0.7 && daysSinceLast <= 2) status = 'ملتزم';
    else if (adherenceRate >= 0.4) status = 'متذبذب';
    else status = 'متوقف';

    return {
      remedy: r,
      completed,
      target: r.targetCount,
      adherenceRate,
      streak: bestStreak,
      lastDone,
      status,
    };
  }

  private renderMarkdown(
    userName: string,
    progress: RemedyProgress[],
    overall: number
  ): string {
    const lines: string[] = [];
    lines.push(`# ✅ متتبع الالتزام — ${userName}`);
    lines.push('');
    lines.push(`**نسبة الالتزام الإجمالية:** ${(overall * 100).toFixed(0)}%`);
    lines.push('');
    if (progress.length === 0) {
      lines.push('لا توجد توصيات مسجلة بعد.');
      return lines.join('\n');
    }
    lines.push('## التوصيات');
    lines.push('');
    for (const p of progress) {
      lines.push(`### ${p.remedy.title}`);
      lines.push(`- الوصف: ${p.remedy.description}`);
      lines.push(`- الالتزام: **${(p.adherenceRate * 100).toFixed(0)}%** (${p.completed}/${p.target})`);
      lines.push(`- أعلى سلسلة: ${p.streak} يوم`);
      lines.push(`- آخر تنفيذ: ${p.lastDone ?? '—'}`);
      lines.push(`- الحالة: ${p.status}`);
      lines.push('');
    }
    lines.push('> تتبع صادق لنفسك — التقدم يكمن في الاستمرار لا الكمال.');
    return lines.join('\n');
  }
}
