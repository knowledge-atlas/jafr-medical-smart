// ================================================================
// محرك الفهرسة - يبني فهارس في الذاكرة للبحث السريع
// ================================================================

import { KnowledgeEntity, KnowledgeRelation, IndexStats } from '../types';

export class Indexer {
  // فهارس أساسية
  private entities = new Map<string, KnowledgeEntity>();
  private relations = new Map<string, KnowledgeRelation>();

  // فهارس فرعية (لل بحث السريع)
  private byType = new Map<string, Set<string>>();
  private byNumber = new Map<string, string>();       // "root:1" -> entityId
  private keywordIndex = new Map<string, Set<string>>();
  private titleIndex = new Map<string, Set<string>>();

  /**
   * إضافة كيان
   */
  addEntity(entity: KnowledgeEntity): void {
    this.entities.set(entity.id, entity);

    // فهرس حسب النوع
    if (!this.byType.has(entity.entityType)) {
      this.byType.set(entity.entityType, new Set());
    }
    this.byType.get(entity.entityType)!.add(entity.id);

    // فهرس حسب النوع + الرقم
    if (entity.entityNumber !== undefined) {
      this.byNumber.set(`${entity.entityType}:${entity.entityNumber}`, entity.id);
    }

    // فهرس الكلمات المفتاحية
    if (entity.keywords) {
      for (const kw of entity.keywords) {
        const normalized = this.normalizeText(kw);
        if (!this.keywordIndex.has(normalized)) {
          this.keywordIndex.set(normalized, new Set());
        }
        this.keywordIndex.get(normalized)!.add(entity.id);
      }
    }

    // فهرس العناوين (كلمات العنوان)
    const titleWords = this.tokenize(entity.titleAr || entity.title);
    for (const word of titleWords) {
      if (!this.titleIndex.has(word)) {
        this.titleIndex.set(word, new Set());
      }
      this.titleIndex.get(word)!.add(entity.id);
    }
  }

  /**
   * إضافة علاقة
   */
  addRelation(relation: KnowledgeRelation): void {
    this.relations.set(relation.id, relation);
  }

  /**
   * الحصول على كيان بالمعرّف
   */
  getEntity(id: string): KnowledgeEntity | undefined {
    return this.entities.get(id);
  }

  /**
   * الحصول على كيان حسب النوع والرقم
   */
  getEntityByTypeAndNumber(type: string, num: number): KnowledgeEntity | undefined {
    const id = this.byNumber.get(`${type}:${num}`);
    return id ? this.entities.get(id) : undefined;
  }

  /**
   * الحصول على جميع كيانات نوع معين
   */
  getEntitiesByType(type: string): KnowledgeEntity[] {
    const ids = this.byType.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
  }

  /**
   * الحصول على العلاقات من كيان
   */
  getRelationsFrom(sourceId: string): KnowledgeRelation[] {
    return Array.from(this.relations.values()).filter(
      r => r.sourceEntityId === sourceId
    );
  }

  /**
   * الحصول على العلاقات إلى كيان
   */
  getRelationsTo(targetId: string): KnowledgeRelation[] {
    return Array.from(this.relations.values()).filter(
      r => r.targetEntityId === targetId
    );
  }

  /**
   * الحصول على الكلمات المفتاحية
   */
  getEntitiesByKeyword(keyword: string): KnowledgeEntity[] {
    const normalized = this.normalizeText(keyword);
    const ids = this.keywordIndex.get(normalized);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
  }

  /**
   * الحصول على الكيانات التي تحتوي كلمة في عنوانها
   */
  getEntitiesByTitleWord(word: string): KnowledgeEntity[] {
    const normalized = this.normalizeText(word);
    const ids = this.titleIndex.get(normalized);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
  }

  /**
   * الحصول على كل الكيانات
   */
  getAllEntities(): KnowledgeEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * الحصول على كل العلاقات
   */
  getAllRelations(): KnowledgeRelation[] {
    return Array.from(this.relations.values());
  }

  /**
   * إحصائيات
   */
  stats(): IndexStats {
    const byType: Record<string, number> = {};
    for (const [type, ids] of this.byType.entries()) {
      byType[type] = ids.size;
    }
    return {
      totalEntities: this.entities.size,
      totalRelations: this.relations.size,
      byType,
      indexedAt: new Date().toISOString(),
      hash: this.computeHash(),
    };
  }

  /**
   * مسح كل الفهارس
   */
  clear(): void {
    this.entities.clear();
    this.relations.clear();
    this.byType.clear();
    this.byNumber.clear();
    this.keywordIndex.clear();
    this.titleIndex.clear();
  }

  // ═══════════════════════════════════════════════════════════
  // أدوات داخلية
  // ═══════════════════════════════════════════════════════════

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ىي]/g, 'ي')
      .replace(/[ةه]/g, 'ه')
      .replace(/[\u064B-\u065F]/g, '')  // إزالة التشكيل
      .trim();
  }

  private tokenize(text: string): string[] {
    return text
      .split(/[\s،,.:;!?()\[\]{}«»"'-]+/)
      .map(w => this.normalizeText(w))
      .filter(w => w.length >= 2);
  }

  private computeHash(): string {
    const data = `${this.entities.size}:${this.relations.size}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}
