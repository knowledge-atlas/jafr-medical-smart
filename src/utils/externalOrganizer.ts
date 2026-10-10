import { UserEntity, externalStorage } from './externalStorage';
import { AnalysisSignature } from './externalMatcher';
import { splitIntoTableBlocks } from './smartFormatter';

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

export interface OrganizedGroup {
  key: string;
  label: string;
  icon: string;
  entities: UserEntity[];
}

// ═══════════════════════════════════════════════════════════
// matchAnyKeyword — فحص إن كان الكيان يحتوي أياً من الكلمات
// ═══════════════════════════════════════════════════════════
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// مطابقة كلمة كاملة (غير مرتبطة بحروف أخرى)
function matchAnyKeyword(entity: UserEntity, keywords: string[]): boolean {
  const haystack = normAr(
    `${entity.titleAr} ${entity.fullText} ${(entity.keywords ?? []).join(' ')}`
  );
  return keywords.some((k) => {
    const nk = normAr(k);
    if (nk.length < 2) return false;
    // مطابقة كلمة كاملة (يحيطها حدود كلمة)
    try {
      const re = new RegExp(`(^|[\\s،.؛:!?\\-_/])${escapeRegex(nk)}($|[\\s،.؛:!?\\-_/])`);
      return re.test(haystack);
    } catch {
      return haystack.includes(nk);
    }
  });
}

// ═══════════════════════════════════════════════════════════
// organizeExternalByAnalysis — التنظيم الكامل
// ═══════════════════════════════════════════════════════════
export function organizeExternalByAnalysis(
  sig: AnalysisSignature,
  entities: UserEntity[]
): OrganizedGroup[] {
  const groups: OrganizedGroup[] = [];
  const seenIds = new Set<string>();

  const markAndPush = (
    key: string,
    label: string,
    icon: string,
    matcher: (e: UserEntity) => boolean
  ) => {
    const all = entities.filter((e) => !seenIds.has(e.id) && matcher(e));
    if (all.length === 0) return;
    // حد أقصى 10 كيانات لكل مجموعة (الأطول أولاً)
    const found = all
      .sort((a, b) => b.fullText.length - a.fullText.length)
      .slice(0, 10);
    // سجّل الكل كـseen لتجنب التكرار في المجموعات التالية
    all.forEach((e) => seenIds.add(e.id));
    groups.push({ key, label, icon, entities: found });
  };

  // ═══ 1) الاسم المباشر ═══
  if (sig.name && sig.name.length >= 2) {
    const n = normAr(sig.name);
    markAndPush('name', `الاسم: ${sig.name}`, '👤', (e) => {
      return (
        normAr(e.titleAr).includes(n) ||
        normAr(e.fullText).includes(n) ||
        (e.keywords ?? []).some((k) => normAr(k).includes(n))
      );
    });
  }

  // ═══ 2) الجذر ═══
  if (sig.root !== undefined) {
    const kws = [
      `الجذر ${sig.root}`,
      `الجذر${sig.root}`,
      `Root ${sig.root}`,
      `root_${sig.root}`,
      `root${sig.root}`,
    ];
    markAndPush('root', `الجذر ${sig.root}`, '🌱', (e) => matchAnyKeyword(e, kws));
  }

  // ═══ 3) الكوكب ═══
  if (sig.planet) {
    const kws = [sig.planet, `كوكب ${sig.planet}`, `الكوكب ${sig.planet}`];
    markAndPush('planet', `الكوكب: ${sig.planet}`, '🪐', (e) => matchAnyKeyword(e, kws));
  }

  // ═══ 4) البرج ═══
  if (sig.sign) {
    const kws = [sig.sign, `برج ${sig.sign}`, `البرج ${sig.sign}`];
    markAndPush('sign', `البرج: ${sig.sign}`, '♈', (e) => matchAnyKeyword(e, kws));
  }

  // ═══ 5) البيت ═══
  if (sig.house !== undefined) {
    const kws = [`البيت ${sig.house}`, `house_${sig.house}`, `house${sig.house}`, `البيت ال${sig.house}`];
    markAndPush('house', `البيت: ${sig.house}`, '🏠', (e) => matchAnyKeyword(e, kws));
  }

  // ═══ 6) الطبع ═══
  if (sig.element) {
    const kws = [sig.element, `طبع ${sig.element}`, `الطبع ال${sig.element}`];
    markAndPush('element', `الطبع: ${sig.element}`, '🔥', (e) => matchAnyKeyword(e, kws));
  }

  // ═══ 7) الرنين ═══
  markAndPush('resonance', 'الرنين', '🎵', (e) =>
    matchAnyKeyword(e, ['رنين', 'تناغم', 'انسجام'])
  );

  // لا نضيف "شواهد أخرى" — فقط ما يطابق التحليل

  return groups;
}

// ═══════════════════════════════════════════════════════════
// buildOrganizedBlocks — يبني كل البلوكات لـ BlockRenderer
// ═══════════════════════════════════════════════════════════
export interface OrganizerOptions {
  maxCharsPerEntity?: number;
  maxPerGroup?: number;
}

export function buildOrganizedBlocks(
  groups: OrganizedGroup[],
  options: OrganizerOptions = {}
): any[] {
  const maxChars = options.maxCharsPerEntity ?? 2500;
  const maxPerGroup = options.maxPerGroup ?? 8;

  const blocks: any[] = [];

  const totalEntities = groups.reduce((s, g) => s + g.entities.length, 0);

  blocks.push({
    type: 'box',
    title: '📊 ملخص الموسوعة الخارجية',
    rows: [
      ['إجمالي الشواهد', `${totalEntities} كيان`],
      ['عدد المجموعات', `${groups.length}`],
      ['حد العرض', `${maxChars} حرف لكل شاهد`],
      ...groups.map((g) => [g.label, `${g.entities.length}`]),
    ],
  });

  blocks.push({ type: 'separator' });

  for (const group of groups) {
    blocks.push({
      type: 'heading',
      level: 2,
      text: `${group.icon} ${group.label} (${group.entities.length})`,
    });

    const shown = group.entities.slice(0, maxPerGroup);

    for (let i = 0; i < shown.length; i++) {
      const e = shown[i];
      const totalLen = e.fullText.length;
      const truncated = totalLen > maxChars;
      const body = truncated ? e.fullText.slice(0, maxChars) : e.fullText;

      // ═══ رأس معلومات الشاهد ═══
      const metaRows: [string, string][] = [
        ['المصدر', e.sourceFile],
        ['النوع', e.entityType],
      ];
      if (truncated) {
        metaRows.push(['حجم النص', `${totalLen.toLocaleString()} حرف (معروض ${maxChars})`]);
      }

      blocks.push({
        type: 'box',
        title: `📄 ${i + 1}. ${e.titleAr}`,
        evidenceLevel: (e as any).evidenceLevel,
        rows: metaRows,
      });

      // ═══ المحتوى — يُكتشف ويُعرض كجداول + نصوص ═══
      const contentBlocks = splitIntoTableBlocks(body);
      for (const cb of contentBlocks) {
        blocks.push(cb);
      }
    }

    if (group.entities.length > maxPerGroup) {
      const extra = group.entities.length - maxPerGroup;
      blocks.push({
        type: 'box',
        title: '',
        rows: [
          ['', `⚠️ يوجد ${extra} شاهد إضافي في هذه المجموعة. اقتصاص تلقائي للحفاظ على الأداء.`],
        ],
      });
    }

    blocks.push({ type: 'separator' });
  }

  return blocks;
}
