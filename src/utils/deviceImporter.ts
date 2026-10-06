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
export function parseTextContent(raw: string, sourceFile: string): UserEntity[] {
  if (!raw || raw.trim().length < 30) return [];

  // اقسم على سطرين فارغين أو ثلاث
  const chunks = raw
    .split(/\n\s*\n\s*\n|\n\s*\n/)
    .map((c) => c.trim())
    .filter((c) => c.length >= 40);

  const now = new Date().toISOString();
  return chunks.map((chunk, i) => {
    // أول سطر = عنوان مرشح
    const firstLine = chunk.split('\n')[0].trim();
    const titleAr = firstLine.length >= 3 && firstLine.length <= 80
      ? firstLine.replace(/^[#*\-\s]+/, '')
      : `مقتطف ${i + 1} من ${sourceFile}`;

    const keywords: string[] = [];
    // استخرج كلمات عربية طولها >= 4
    const words = normAr(chunk).split(/\s+/);
    const seen = new Set<string>();
    for (const w of words) {
      if (w.length >= 4 && !seen.has(w) && keywords.length < 30) {
        seen.add(w);
        keywords.push(w);
      }
    }

    return {
      id: `usr_txt_${shortHash(`${sourceFile}_${i}_${chunk.slice(0, 60)}`)}`,
      entityType: 'custom',
      titleAr,
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
