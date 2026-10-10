import { UserEntity } from './externalStorage';

// ═══════════════════════════════════════════════════════════
// normalizeArabic — تطبيع بسيط للبحث
// ═══════════════════════════════════════════════════════════
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

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

// ═══════════════════════════════════════════════════════════
// parseJsonContent — يدعم: array، {entities}، {items}، object
// ═══════════════════════════════════════════════════════════
export function parseJsonContent(raw: string, sourceFile: string): UserEntity[] {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e: any) {
    throw new Error(`JSON غير صالح: ${e.message}`);
  }

  let items: any[] = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data.entities)) items = data.entities;
  else if (Array.isArray(data.items)) items = data.items;
  else if (typeof data === 'object' && data !== null) items = [data];

  const now = new Date().toISOString();
  const out: UserEntity[] = [];

  for (const it of items) {
    if (!it || typeof it !== 'object') continue;

    // استخرج العنوان (مرونة كاملة)
    const titleAr: string = String(
      it.titleAr ?? it.title ?? it.name ?? it.label ?? ''
    ).trim();

    // استخرج النص الكامل
    const fullText: string = String(
      it.fullText ?? it.text ?? it.content ?? it.body ?? it.description ?? ''
    ).trim();

    if (!titleAr && !fullText) continue;
    if (fullText.length < 30 && titleAr.length < 2) continue;

    const entityType: string = String(
      it.entityType ?? it.type ?? it.category ?? 'custom'
    ).trim();

    // كلمات مفتاحية
    let keywords: string[] = [];
    if (Array.isArray(it.keywords)) keywords = it.keywords.map((k: any) => String(k));
    else if (typeof it.keywords === 'string') keywords = it.keywords.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean);

    // أضف كلمات من العنوان تلقائياً
    if (titleAr) {
      titleAr.split(/\s+/).forEach((w) => {
        if (w.length >= 3) keywords.push(w);
      });
    }

    // معرف فريد
    const id = String(
      it.id ?? `usr_${shortHash(`${titleAr}::${fullText.slice(0, 80)}`)}`
    );

    out.push({
      id,
      entityType,
      evidenceLevel: classifyEvidenceLevel(entityType, sourceFile),
      entityNumber: typeof it.entityNumber === 'number' ? it.entityNumber : undefined,
      titleAr: titleAr || `مقتطف من ${sourceFile}`,
      fullText,
      summary: it.summary,
      keywords: Array.from(new Set(keywords)),
      sourceFile,
      importedAt: now,
      metadata: it.metadata,
    });
  }

  return out;
}

// ═══════════════════════════════════════════════════════════
// parseTextContent — يقسم نصاً عادياً إلى فقرات
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// detectTitle — استخراج عنوان ذكي من أول سطر
// ═══════════════════════════════════════════════════════════
function detectTitle(chunk: string): { title: string; entityType: string; entityNumber?: number } {
  const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
  const first = lines[0] || '';

  // 1) Markdown heading: ## الجذر 7 — الاسم
  const mdMatch = first.match(/^#{1,6}\s+(.+)$/);
  if (mdMatch) {
    const h = mdMatch[1].trim();
    return { title: h, entityType: classifyType(h), entityNumber: extractNumber(h) };
  }

  // 2) "كيان جذره 7"
  const kyanMatch = first.match(/كيان\s+جذر(?:ه|ُه)?\s+(\d)/);
  if (kyanMatch) {
    const n = parseInt(kyanMatch[1], 10);
    return { title: `الجذر ${n} — تحليل الكيان`, entityType: 'root', entityNumber: n };
  }

  // 3) "الجذر N" في أول 80 حرف
  const rootMatch = first.match(/الجذر\s+(\d)/);
  if (rootMatch && first.length <= 100) {
    const n = parseInt(rootMatch[1], 10);
    return { title: `الجذر ${n}`, entityType: 'root', entityNumber: n };
  }

  // 4) "الكوكب: X" أو "البرج: X"
  const planetMatch = first.match(/الكوكب[:：]\s*(.+)$/);
  if (planetMatch) {
    return { title: `الكوكب: ${planetMatch[1].trim()}`, entityType: 'planet' };
  }
  const signMatch = first.match(/البرج[:：]\s*(.+)$/);
  if (signMatch) {
    return { title: `البرج: ${signMatch[1].trim()}`, entityType: 'sign' };
  }

  // 5) عنوان قصير (≤ 80 حرف، بلا نقطة نهاية)
  if (first.length >= 3 && first.length <= 80 && !/[.!؟]$/.test(first) && lines.length > 1) {
    return { title: first, entityType: classifyType(first), entityNumber: extractNumber(first) };
  }

  // 6) fallback — أول 60 حرف
  const short = first.slice(0, 60).trim();
  return { title: short || 'مقتطف', entityType: 'custom' };
}

function classifyType(text: string): string {
  if (/الجذر|كيان جذره/.test(text)) return 'root';
  if (/كوكب|الكوكب/.test(text)) return 'planet';
  if (/برج|البرج/.test(text)) return 'sign';
  if (/بيت|البيت/.test(text)) return 'house';
  if (/طبع|الطبع/.test(text)) return 'element';
  if (/حرف|الحرف/.test(text)) return 'letter';
  if (/رنين/.test(text)) return 'resonance';
  if (/ترياق/.test(text)) return 'remedy';
  if (/طبي|طب/.test(text)) return 'medical';
  if (/باقي|البواقي/.test(text)) return 'remainder';
  if (/وفق|الوفق/.test(text)) return 'wafq';
  return 'custom';
}

function extractNumber(text: string): number | undefined {
  const m = text.match(/(?:الجذر|جذره|رقم)\s*(\d)/);
  return m ? parseInt(m[1], 10) : undefined;
}

export function parseTextContent(raw: string, sourceFile: string): UserEntity[] {
  if (!raw || raw.trim().length < 30) return [];

  const chunks = raw
    .split(/\n\s*\n\s*\n|\n\s*\n/)
    .map((c) => c.trim())
    .filter((c) => c.length >= 40);

  const now = new Date().toISOString();
  return chunks.map((chunk, i) => {
    const detected = detectTitle(chunk);

    const keywords: string[] = [];
    const words = normAr(chunk).split(/\s+/);
    const seen = new Set<string>();
    for (const w of words) {
      if (w.length >= 4 && !seen.has(w) && keywords.length < 40) {
        seen.add(w);
        keywords.push(w);
      }
    }

    return {
      evidenceLevel: classifyEvidenceLevel('custom', sourceFile),
      id: `usr_txt_${shortHash(`${sourceFile}_${i}_${chunk.slice(0, 60)}`)}`,
      entityType: detected.entityType,
      entityNumber: detected.entityNumber,
      titleAr: detected.title,
      fullText: chunk,
      keywords,
      sourceFile,
      importedAt: now,
    };
  });
}

// ═══════════════════════════════════════════════════════════
// autoParse — يكتشف النوع ويحلل
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// classifyEvidenceLevel — يصنّف كل كيان مستورد تلقائياً
// ═══════════════════════════════════════════════════════════
function classifyEvidenceLevel(entityType: string, sourceFile: string): 'A' | 'B' | 'C' | 'D' | 'E' {
  const sf = sourceFile.toLowerCase();

  // Wikipedia أو ملفات علمية → B (تاريخي)
  if (sf.includes('wiki') || sf.includes('wikipedia')) return 'B';

  // ملفات تراثية (بوني، موسوعة، جفر) → C (تراثي)
  if (sf.includes('buni') || sf.includes('jafr') || sf.includes('encyclopedia')) return 'C';

  // ملفات طبية → E (فرضي)
  if (entityType === 'medical' || entityType === 'remedy') return 'E';

  // الافتراضي: C (تراثي — نحن نتعامل مع مصادر تراثية)
  return 'C';
}

export function autoParse(raw: string, sourceFile: string): {
  entities: UserEntity[];
  format: 'json' | 'text';
} {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const entities = parseJsonContent(raw, sourceFile);
      return { entities, format: 'json' };
    } catch {
      // fallthrough
    }
  }
  return { entities: parseTextContent(raw, sourceFile), format: 'text' };
}
