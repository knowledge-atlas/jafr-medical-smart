// ================================================================
// أنواع قاعدة المعرفة
// ================================================================

export type EntityType =
  | 'root'
  | 'planet'
  | 'sign'
  | 'house'
  | 'element'
  | 'letter'
  | 'remainder'
  | 'compound'
  | 'resonance'
  | 'remedy'
  | 'wafq'
  | 'medical_root'
  | 'medical_remainder'
  | 'medical_table';

export type SourceType = 'internal' | 'external';

export interface KnowledgeEntity {
  id: string;                       // مثال: "root_1"
  entityType: EntityType;
  entityNumber?: number;             // 1-9، 1-10، ...
  title: string;                     // الاسم المختصر
  titleAr: string;                   // بالعربية
  fullText: string;                  // النص الأصلي كاملاً
  summary?: string;                  // ملخص للعرض
  sourceType: SourceType;            // داخلي/خارجي
  sourceFile: string;                // اسم الملف الأصلي
  sha256?: string;                   // بصمة (إن وجدت)
  metadata?: Record<string, any>;
  keywords?: string[];               // كلمات مفتاحية للبحث
}

export interface KnowledgeRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;              // RESONATES_WITH, GOVERNED_BY, ...
  weight?: number;                   // 1.0 افتراضاً
  metadata?: Record<string, any>;
}

export interface SearchResult {
  entity: KnowledgeEntity;
  score: number;                     // درجة الصلة (0-1)
  matchedIn: 'title' | 'fullText' | 'keyword' | 'summary';
  snippet: string;                   // مقتطف من النص
}

export interface SearchOptions {
  entityTypes?: EntityType[];
  sourceType?: SourceType;
  limit?: number;
  minScore?: number;
}

// ═══════════════════════════════════════════════════════════════
// تقرير الفهرس
// ═══════════════════════════════════════════════════════════════
export interface IndexStats {
  totalEntities: number;
  totalRelations: number;
  byType: Record<string, number>;
  indexedAt: string;
  hash: string;
}
