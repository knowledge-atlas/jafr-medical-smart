// ================================================================
// قاعدة المعرفة الرئيسية - الواجهة الموحدة
// ================================================================

import { Indexer } from './engines/Indexer';
import { SearchEngine } from './engines/SearchEngine';
import { kbStorage } from './storage/AsyncStorageAdapter';
import { KnowledgeEntity, KnowledgeRelation, SearchResult, SearchOptions, IndexStats } from './types';

const STORAGE_KEY = 'knowledge_base_v1';
const INDEX_READY_KEY = 'index_ready';

class KnowledgeBaseClass {
  public indexer: Indexer;
  public search: SearchEngine;

  private initialized = false;

  constructor() {
    this.indexer = new Indexer();
    this.search = new SearchEngine(this.indexer);
  }

  /**
   * تهيئة قاعدة المعرفة
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('📚 تهيئة قاعدة المعرفة...');

      // هل الفهارس محفوظة؟
      const ready = await kbStorage.get<boolean>(INDEX_READY_KEY);

      if (ready) {
        // استرجاع من التخزين
        const saved = await kbStorage.get<{
          entities: KnowledgeEntity[];
          relations: KnowledgeRelation[];
        }>(STORAGE_KEY);

        if (saved) {
          for (const e of saved.entities) this.indexer.addEntity(e);
          for (const r of saved.relations) this.indexer.addRelation(r);
          console.log(`✅ تم استرجاع ${saved.entities.length} كيان، ${saved.relations.length} علاقة`);
        }
      } else {
        console.log('⚠️ الفهارس غير محفوظة — سيتم بناؤها من البيانات الأساسية');
      }

      this.initialized = true;
      console.log('✅ قاعدة المعرفة جاهزة');
    } catch (error) {
      console.error('❌ فشل تهيئة قاعدة المعرفة:', error);
      throw error;
    }
  }

  /**
   * استيراد كيانات
   */
  importEntities(entities: KnowledgeEntity[]): void {
    for (const entity of entities) {
      this.indexer.addEntity(entity);
    }
    console.log(`📥 تم استيراد ${entities.length} كيان`);
  }

  /**
   * استيراد علاقات
   */
  importRelations(relations: KnowledgeRelation[]): void {
    for (const relation of relations) {
      this.indexer.addRelation(relation);
    }
    console.log(`🔗 تم استيراد ${relations.length} علاقة`);
  }

  /**
   * حفظ الفهارس في التخزين
   */
  async persist(): Promise<void> {
    try {
      const data = {
        entities: this.indexer.getAllEntities(),
        relations: this.indexer.getAllRelations(),
      };
      await kbStorage.set(STORAGE_KEY, data);
      await kbStorage.set(INDEX_READY_KEY, true);
      console.log(`💾 تم حفظ ${data.entities.length} كيان في التخزين`);
    } catch (error) {
      console.error('❌ فشل حفظ الفهارس:', error);
    }
  }

  /**
   * البحث
   */
  searchQuery(query: string, options?: SearchOptions): SearchResult[] {
    return this.search.search(query, options);
  }

  /**
   * الحصول على كيان
   */
  getEntity(id: string): KnowledgeEntity | undefined {
    return this.indexer.getEntity(id);
  }

  /**
   * الحصول على كيان حسب النوع والرقم
   */
  getRoot(num: number): KnowledgeEntity | undefined {
    return this.indexer.getEntityByTypeAndNumber('root', num);
  }

  getPlanet(num: number): KnowledgeEntity | undefined {
    return this.indexer.getEntityByTypeAndNumber('planet', num);
  }

  getSign(num: number): KnowledgeEntity | undefined {
    return this.indexer.getEntityByTypeAndNumber('sign', num);
  }

  getHouse(num: number): KnowledgeEntity | undefined {
    return this.indexer.getEntityByTypeAndNumber('house', num);
  }

  getElement(num: number): KnowledgeEntity | undefined {
    return this.indexer.getEntityByTypeAndNumber('element', num);
  }

  /**
   * الحصول على العلاقات من كيان
   */
  getRelations(entityId: string): {
    from: KnowledgeRelation[];
    to: KnowledgeRelation[];
  } {
    return {
      from: this.indexer.getRelationsFrom(entityId),
      to: this.indexer.getRelationsTo(entityId),
    };
  }

  /**
   * إحصائيات
   */
  stats(): IndexStats {
    return this.indexer.stats();
  }

  /**
   * مسح كل شيء
   */
  async reset(): Promise<void> {
    this.indexer.clear();
    await kbStorage.clear();
    this.initialized = false;
    console.log('🗑️ تم مسح قاعدة المعرفة');
  }
}

export const KnowledgeBase = new KnowledgeBaseClass();
