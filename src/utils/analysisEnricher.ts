import { externalStorage } from './externalStorage';
import { matchEntities, AnalysisSignature, MatchedEntity } from './externalMatcher';

export interface EvidenceResult {
  count: number;
  blocks: any[];              // ReportBlock[]
  markdown: string;           // للنسخ والمشاركة
  matches: MatchedEntity[];
}

// ═══════════════════════════════════════════════════════════
// buildEvidence — الأساس
// ═══════════════════════════════════════════════════════════
export async function buildEvidence(sig: AnalysisSignature): Promise<EvidenceResult> {
  const entities = await externalStorage.getAll();
  if (entities.length === 0) {
    return { count: 0, blocks: [], markdown: '', matches: [] };
  }

  const rawMatches = matchEntities(sig, entities, { minScore: 2, maxResults: 50 });
  if (rawMatches.length === 0) {
    return { count: 0, blocks: [], markdown: '', matches: [] };
  }

  // ═══════════════════════════════════════════════════════════
  // 1) إزالة التكرار حسب بصمة النص (أول 200 حرف مطبَّعة)
  // ═══════════════════════════════════════════════════════════
  const normFinger = (t: string): string =>
    t.replace(/[\u064B-\u0652]/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .slice(0, 200);

  const seenFinger = new Set<string>();
  const seenTitle = new Set<string>();
  const unique: typeof rawMatches = [];

  for (const m of rawMatches) {
    const finger = normFinger(m.entity.fullText);
    const titleKey = normFinger(m.entity.titleAr).slice(0, 60);

    if (seenFinger.has(finger)) continue;
    if (seenTitle.has(titleKey) && seenTitle.size > 0) {
      // اسمح بعنوان واحد فقط
      continue;
    }

    seenFinger.add(finger);
    seenTitle.add(titleKey);
    unique.push(m);

    if (unique.length >= 5) break;
  }

  // ═══ رأس القسم ═══
  const blocks: any[] = [];
  const mdLines: string[] = [];

  mdLines.push('## 🌐 شواهد خارجية — من مصادرك');
  mdLines.push('');
  mdLines.push(`تم العثور على **${unique.length}** شاهد من مصادرك المحفوظة.`);
  mdLines.push('');

  // ═══ سياق التطابق ═══
  const contextParts: string[] = [];
  if (sig.root !== undefined) contextParts.push(`الجذر ${sig.root}`);
  if (sig.planet) contextParts.push(`الكوكب ${sig.planet}`);
  if (sig.sign) contextParts.push(`البرج ${sig.sign}`);
  if (sig.element) contextParts.push(`الطبع ${sig.element}`);
  if (contextParts.length) {
    blocks.push({
      type: 'box',
      title: 'سياق التطابق',
      rows: [
        ['الاسم', sig.name],
        ['المحاور', contextParts.join(' · ')],
      ],
    });
    mdLines.push(`**سياق التطابق:** ${contextParts.join(' · ')}`);
    mdLines.push('');
  }

  // ═══ الشواهد ═══
  for (let i = 0; i < unique.length; i++) {
    const m = unique[i];
    const e = m.entity;
    const excerpt = e.fullText.length > 900
      ? e.fullText.slice(0, 900) + '…'
      : e.fullText;

    blocks.push({
      type: 'subheading',
      text: `${i + 1}. ${e.titleAr}`,
    });

    blocks.push({
      type: 'box',
      title: `📄 ${e.titleAr}`,
      rows: [
        ['المصدر', e.sourceFile],
        ['النوع', e.entityType],
        ['قوة التطابق', `${m.score} (${m.matchedKeywords.length} مفتاح)`],
        ['', excerpt],
      ],
    });

    if (i < unique.length - 1) {
      blocks.push({ type: 'separator' });
    }

    mdLines.push(`### ${i + 1}. ${e.titleAr}`);
    mdLines.push(`> المصدر: ${e.sourceFile}`);
    mdLines.push('');
    mdLines.push(excerpt);
    mdLines.push('');
  }

  return {
    count: unique.length,
    blocks,
    markdown: mdLines.join('\n'),
    matches: unique,
  };
}

// ═══════════════════════════════════════════════════════════
// buildSignatureFromAnalysis — من AnalysisResult
// ═══════════════════════════════════════════════════════════
export function buildSignatureFromAnalysis(analysis: any): AnalysisSignature {
  const L = analysis?.layers ?? analysis ?? {};
  return {
    name: analysis?.name ?? L.name ?? '',
    root: typeof L.root === 'number' ? L.root : Number(L.root) || undefined,
    planet: L.planet,
    sign: L.sign,
    element: L.element,
    house: typeof L.house === 'number' ? L.house : Number(L.house) || undefined,
    total: analysis?.calculation?.total,
  };
}
