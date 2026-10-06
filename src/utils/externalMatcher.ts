import { UserEntity } from './externalStorage';

function normAr(t: string): string {
  if (!t) return '';
  return String(t)
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface AnalysisSignature {
  name: string;
  root?: number;
  rootNumeral?: number;
  planet?: string;
  sign?: string;
  element?: string;
  house?: number;
  total?: number;
}

export interface MatchedEntity {
  entity: UserEntity;
  score: number;
  matchedKeywords: string[];
}

// ═══════════════════════════════════════════════════════════
// buildKeywords — يولّد كل الكلمات المفتاحية من التحليل
// ═══════════════════════════════════════════════════════════
export function buildKeywords(sig: AnalysisSignature): string[] {
  const kws = new Set<string>();

  if (sig.name) kws.add(sig.name);

  if (sig.root !== undefined) {
    kws.add(`الجذر ${sig.root}`);
    kws.add(`الجذر${sig.root}`);
    kws.add(`root${sig.root}`);
    kws.add(`root_${sig.root}`);
    kws.add(`الجذر ال${sig.root}`);
  }

  if (sig.planet) {
    kws.add(sig.planet);
    kws.add(`كوكب ${sig.planet}`);
  }

  if (sig.sign) {
    kws.add(sig.sign);
    kws.add(`برج ${sig.sign}`);
    kws.add(`ال${sig.sign}`);
  }

  if (sig.element) {
    kws.add(sig.element);
    kws.add(`طبع ${sig.element}`);
    kws.add(`الطبع ال${sig.element}`);
  }

  if (sig.house !== undefined) {
    kws.add(`البيت ${sig.house}`);
    kws.add(`house_${sig.house}`);
    kws.add(`house${sig.house}`);
  }

  return Array.from(kws).map(normAr).filter((k) => k.length >= 2);
}

// ═══════════════════════════════════════════════════════════
// matchEntities — يرتب الكيانات حسب درجة التطابق
// ═══════════════════════════════════════════════════════════
export function matchEntities(
  sig: AnalysisSignature,
  entities: UserEntity[],
  options: { minScore?: number; maxResults?: number } = {}
): MatchedEntity[] {
  const minScore = options.minScore ?? 1;
  const maxResults = options.maxResults ?? 12;

  const keywords = buildKeywords(sig);
  if (keywords.length === 0) return [];

  const matched: MatchedEntity[] = [];

  for (const e of entities) {
    const title = normAr(e.titleAr);
    const body = normAr(e.fullText);
    const kwText = normAr((e.keywords ?? []).join(' '));
    const haystack = `${title} ${body} ${kwText}`;

    const hits: string[] = [];
    let score = 0;

    for (const kw of keywords) {
      if (kw.length < 2) continue;

      // مطابقة في الكلمات المفتاحية = وزن أعلى
      if (kwText.includes(kw)) {
        score += kw.length >= 5 ? 3 : 2;
        hits.push(kw);
        continue;
      }

      // مطابقة في العنوان = وزن متوسط
      if (title.includes(kw)) {
        score += kw.length >= 5 ? 2 : 1;
        hits.push(kw);
        continue;
      }

      // مطابقة في النص = وزن منخفض
      if (body.includes(kw)) {
        score += 1;
        hits.push(kw);
      }
    }

    if (score >= minScore) {
      matched.push({ entity: e, score, matchedKeywords: hits });
    }
  }

  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, maxResults);
}
