// ═══════════════════════════════════════════════════════════
// External Knowledge Importer
// يقرأ src/data/external/entities.json ويحوّلها إلى KnowledgeEntity
// ═══════════════════════════════════════════════════════════

let externalEntitiesCache: ExternalFile | null = null;

export interface ExternalFile {
  generatedAt: string;
  total: number;
  byType: Record<string, number>;
  entities: any[];
}

export function loadExternalFile(): ExternalFile | null {
  try {
    // dynamic require — Metro يحزم الملف مع الـbundle
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require('../../data/external/entities.json');
    externalEntitiesCache = data;
    return data;
  } catch {
    // الملف غير موجود — طبيعي في أول تشغيل
    return null;
  }
}

export function getExternalEntities(): any[] {
  const file = loadExternalFile();
  return file?.entities ?? [];
}

export function countExternalEntities(): number {
  return getExternalEntities().length;
}

export function getExternalStats(): {
  total: number;
  byType: Record<string, number>;
  generatedAt: string | null;
} {
  const file = loadExternalFile();
  if (!file) return { total: 0, byType: {}, generatedAt: null };

  const byType: Record<string, number> = {};
  for (const e of file.entities) {
    byType[e.entityType] = (byType[e.entityType] ?? 0) + 1;
  }

  return {
    total: file.entities.length,
    byType,
    generatedAt: file.generatedAt ?? null,
  };
}


// ═══════════════════════════════════════════════════════════
// toKnowledgeEntities — تحوّل external إلى KnowledgeEntity[]
// ═══════════════════════════════════════════════════════════
export function toKnowledgeEntities(): any[] {
  return getExternalEntities().map((e) => ({
    id: e.id,
    entityType: e.entityType,
    entityNumber: e.entityNumber,
    title: e.title ?? e.titleAr,
    titleAr: e.titleAr,
    fullText: e.fullText,
    summary: e.summary,
    sourceType: 'external' as const,
    sourceFile: e.sourceFile ?? 'external',
    sha256: e.sha256,
    metadata: e.metadata,
    keywords: e.keywords ?? [],
  }));
}

// ═══════════════════════════════════════════════════════════
// importExternalToKB — يستورد مباشرة إلى KB
// ═══════════════════════════════════════════════════════════
export function importExternalToKB(KnowledgeBase: any): number {
  const items = toKnowledgeEntities();
  if (items.length === 0) return 0;

  try {
    KnowledgeBase.importEntities(items);
    console.log(`📚 تم استيراد ${items.length} كيان خارجي إلى KB`);
    return items.length;
  } catch (e) {
    console.warn('⚠️ فشل استيراد الكيانات الخارجية:', e);
    return 0;
  }
}


// ═══════════════════════════════════════════════════════════
// groupVariantsByEntity — يجمع الشروح المختلفة لنفس الكيان
// ═══════════════════════════════════════════════════════════
export interface EntityVariant {
  sourceId: string;
  lens: string;
  lensLabel: string;
  title: string;
  fullText: string;
  url?: string;
}

export interface EntityGroup {
  key: string;
  entityType: string;
  entityNumber?: number;
  variants: EntityVariant[];
}

export function groupVariantsByEntity(): EntityGroup[] {
  const entities = getExternalEntities();
  const groups = new Map<string, EntityGroup>();

  for (const e of entities) {
    const key = `${e.entityType}::${e.entityNumber ?? 'na'}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        entityType: e.entityType,
        entityNumber: e.entityNumber,
        variants: [],
      });
    }
    groups.get(key)!.variants.push({
      sourceId: e.metadata?.sourceId ?? 'unknown',
      lens: e.metadata?.lens ?? 'general',
      lensLabel: e.metadata?.lensLabel ?? 'عام',
      title: e.titleAr,
      fullText: e.fullText,
      url: e.metadata?.url,
    });
  }

  return Array.from(groups.values());
}
