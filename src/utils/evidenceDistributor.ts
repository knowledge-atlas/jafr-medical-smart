import { MatchedEntity, AnalysisSignature } from './externalMatcher';

export type EvidenceCategory =
  | 'root' | 'planet' | 'sign' | 'house' | 'element'
  | 'resonance' | 'psychology' | 'other';

// ═══════════════════════════════════════════════════════════
// تصنيف القسم بحسب عنوانه
// ═══════════════════════════════════════════════════════════
export function sectionCategory(title: string): EvidenceCategory | null {
  if (!title) return null;
  const t = title.trim();

  if (t.includes('الجذر')) return 'root';
  if (t.includes('الكوكب') || t.includes('كوكب')) return 'planet';
  if (t.includes('البرج') || t.includes('برج')) return 'sign';
  if (t.includes('البيت') || t.includes('بيت')) return 'house';
  if (t.includes('الطبع') || t.includes('طبع')) return 'element';
  if (t.includes('الرنين')) return 'resonance';
  if (t.includes('النفس') || t.includes('الشخصية') || t.includes('الملف النفسي')) return 'psychology';

  return null;
}

// ═══════════════════════════════════════════════════════════
// هل ينتمي الشاهد لهذه الفئة؟
// ═══════════════════════════════════════════════════════════
function normAr(t: string): string {
  return String(t ?? '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function matchBelongsToCategory(
  m: MatchedEntity,
  cat: EvidenceCategory,
  sig: AnalysisSignature
): boolean {
  const kws = m.matchedKeywords.map(normAr);
  const title = normAr(m.entity.titleAr);
  const all = [...kws, title].join(' ');

  const rootKw = sig.root !== undefined ? normAr(`الجذر ${sig.root}`) : '';
  const planetKw = sig.planet ? normAr(sig.planet) : '';
  const signKw = sig.sign ? normAr(sig.sign) : '';
  const houseKw = sig.house !== undefined ? normAr(`البيت ${sig.house}`) : '';
  const elementKw = sig.element ? normAr(sig.element) : '';

  switch (cat) {
    case 'root':
      return /\bالجذر\s*\d/.test(all) || (!!rootKw && all.includes(rootKw));
    case 'planet':
      return planetKw ? all.includes(planetKw) : false;
    case 'sign':
      return signKw ? all.includes(signKw) : false;
    case 'house':
      return /\bالبيت\s*\d/.test(all) || (!!houseKw && all.includes(houseKw));
    case 'element':
      return elementKw ? all.includes(elementKw) : false;
    case 'resonance':
      return all.includes('رنين');
    case 'psychology':
      return all.includes('نفس') || all.includes('شخصية');
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════
// توزيع الشواهد على الأقسام
// ═══════════════════════════════════════════════════════════
export function distributeEvidence(
  sections: { id: string; title: string }[],
  matches: MatchedEntity[],
  sig: AnalysisSignature,
  perSection = 2
): Record<string, MatchedEntity[]> {
  const out: Record<string, MatchedEntity[]> = {};

  for (const section of sections) {
    const cat = sectionCategory(section.title);
    if (!cat) continue;

    const relevant = matches
      .filter((m) => matchBelongsToCategory(m, cat, sig))
      .slice(0, perSection);

    if (relevant.length > 0) {
      out[section.id] = relevant;
    }
  }

  return out;
}

// ═══════════════════════════════════════════════════════════
// بناء بلوكات بلوكس للعرض داخل قسم
// ═══════════════════════════════════════════════════════════
export function buildInlineEvidenceBlocks(matches: MatchedEntity[]): any[] {
  if (matches.length === 0) return [];

  const blocks: any[] = [];

  blocks.push({
    type: 'subheading',
    text: `🌐 شواهد خارجية ذات صلة (${matches.length})`,
  });

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const e = m.entity;
    const excerpt = e.fullText.length > 700
      ? e.fullText.slice(0, 700) + '…'
      : e.fullText;

    blocks.push({
      type: 'box',
      title: `📄 ${e.titleAr}`,
      rows: [
        ['المصدر', e.sourceFile],
        ['قوة التطابق', `${m.score} (${m.matchedKeywords.length} مفتاح)`],
        ['', excerpt],
      ],
    });

    if (i < matches.length - 1) blocks.push({ type: 'separator' });
  }

  return blocks;
}
