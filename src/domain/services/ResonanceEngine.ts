import jafrResonanceData from '../../data/jafr_resonance.json';

export interface ResonanceEntry {
  description: string;
  shadow: string;
  remedy: string;
}

export interface ResonanceResult {
  key: string;
  rootA: number;
  rootB: number;
  entry: ResonanceEntry;
  isSelfResonance: boolean;
  strength: number;
  verdict: 'بناء' | 'توازن' | 'تحذير' | 'صدام';
}

const STRENGTH_RULES: Array<{ pattern: RegExp; strength: number }> = [
  { pattern: /تضاعف|قيادة مضاعفة|احتواء مضاعف|قوي جداً/, strength: 0.95 },
  { pattern: /تأسيس صلب|مشروع|بناء محكم|إمبراطورية/, strength: 0.90 },
  { pattern: /توافق|انسجام|ميزان|قاعدة|إصلاح/, strength: 0.80 },
  { pattern: /عمق|سر|تأمل|بيان|حكمة/, strength: 0.70 },
  { pattern: /شراكة|ارتباط|اتصال/, strength: 0.65 },
  { pattern: /تردد|تشتت|قلق|حيرة|غموض/, strength: 0.45 },
  { pattern: /صدام|تعارض|تهديد|خطر/, strength: 0.30 },
];

const VERDICT_RULES: Array<{ pattern: RegExp; verdict: ResonanceResult['verdict'] }> = [
  { pattern: /صدام|تعارض|تناقض|تضارب/, verdict: 'صدام' },
  { pattern: /تحذير|ظل|مرض|خطر|يحتاج ضبط|يحتاج إلى تهذيب/, verdict: 'تحذير' },
  { pattern: /تضاعف|قوي جداً|قيادة|تأسيس صلب/, verdict: 'بناء' },
  { pattern: /ميزان|توازن|شراكة|إصلاح/, verdict: 'توازن' },
];

export class ResonanceEngine {
  private data: Record<string, ResonanceEntry>;

  constructor(data?: Record<string, ResonanceEntry>) {
    if (data) {
      this.data = data;
    } else {
      const raw = (jafrResonanceData as any)?.rootResonance ?? {};
      this.data = raw as Record<string, ResonanceEntry>;
    }
  }

  private normalizeKey(a: number, b: number): string {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}+${max}`;
  }

  get(rootA: number, rootB: number): ResonanceResult | null {
    if (!Number.isFinite(rootA) || !Number.isFinite(rootB)) return null;
    if (rootA < 1 || rootA > 9 || rootB < 1 || rootB > 9) return null;
    const key = this.normalizeKey(rootA, rootB);
    const entry = this.data[key];
    if (!entry) return null;
    return {
      key,
      rootA: Math.min(rootA, rootB),
      rootB: Math.max(rootA, rootB),
      entry,
      isSelfResonance: rootA === rootB,
      strength: this.estimateStrength(entry),
      verdict: this.estimateVerdict(entry),
    };
  }

  private estimateStrength(entry: ResonanceEntry): number {
    const text = `${entry.description} ${entry.shadow}`;
    for (const rule of STRENGTH_RULES) {
      if (rule.pattern.test(text)) return rule.strength;
    }
    return 0.60;
  }

  private estimateVerdict(entry: ResonanceEntry): ResonanceResult['verdict'] {
    const text = `${entry.description} ${entry.shadow}`;
    for (const rule of VERDICT_RULES) {
      if (rule.pattern.test(text)) return rule.verdict;
    }
    return 'توازن';
  }

  getAll(): ResonanceResult[] {
    const keys = Object.keys(this.data);
    const results: ResonanceResult[] = [];
    for (const key of keys) {
      const [a, b] = key.split('+').map((x) => parseInt(x, 10));
      const r = this.get(a, b);
      if (r) results.push(r);
    }
    return results;
  }

  getForRoot(root: number): ResonanceResult[] {
    return this.getAll().filter((r) => r.rootA === root || r.rootB === root);
  }

  getTopForRoot(root: number, limit: number = 3): ResonanceResult[] {
    return this.getForRoot(root).sort((a, b) => b.strength - a.strength).slice(0, limit);
  }

  getWeakestForRoot(root: number, limit: number = 3): ResonanceResult[] {
    return this.getForRoot(root).sort((a, b) => a.strength - b.strength).slice(0, limit);
  }

  size(): number {
    return Object.keys(this.data).length;
  }
}

export const resonanceEngine = new ResonanceEngine();
