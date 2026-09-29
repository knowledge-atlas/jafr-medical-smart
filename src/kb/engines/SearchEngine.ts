// ================================================================
// محرك البحث - 4 أنواع بحث
// ================================================================

import { Indexer } from './Indexer';
import { KnowledgeEntity, SearchResult, SearchOptions } from '../types';

export class SearchEngine {
  constructor(private indexer: Indexer) {}

  /**
   * البحث الشامل (يجمع كل الأنواع)
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    if (!query || query.trim().length < 2) return [];

    const results: SearchResult[] = [];
    const normalizedQuery = this.normalizeText(query);
    const queryWords = this.tokenize(query);

    // جمع النتائج من 4 مصادر
    results.push(...this.searchByTitle(query, queryWords));
    results.push(...this.searchByKeyword(query, normalizedQuery));
    results.push(...this.searchByFullText(query, queryWords));
    results.push(...this.searchBySummary(query, queryWords));

    // فلترة
    let filtered = results.filter(r => {
      if (options.entityTypes && options.entityTypes.length > 0) {
        if (!options.entityTypes.includes(r.entity.entityType)) return false;
      }
      if (options.sourceType) {
        if (r.entity.sourceType !== options.sourceType) return false;
      }
      if (options.minScore !== undefined) {
        if (r.score < options.minScore) return false;
      }
      return true;
    });

    // إزالة التكرار (نحتفظ بأعلى درجة)
    const uniqueMap = new Map<string, SearchResult>();
    for (const r of filtered) {
      const existing = uniqueMap.get(r.entity.id);
      if (!existing || r.score > existing.score) {
        uniqueMap.set(r.entity.id, r);
      }
    }

    // ترتيب حسب الدرجة
    let finalResults = Array.from(uniqueMap.values())
      .sort((a, b) => b.score - a.score);

    // تحديد العدد
    const limit = options.limit || 20;
    return finalResults.slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════
  // 1. البحث في العناوين
  // ═══════════════════════════════════════════════════════════
  private searchByTitle(query: string, queryWords: string[]): SearchResult[] {
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    for (const word of queryWords) {
      const entities = this.indexer.getEntitiesByTitleWord(word);
      for (const entity of entities) {
        if (seen.has(entity.id)) continue;
        seen.add(entity.id);

        const score = 0.95; // عنوان = أعلى صلة
        results.push({
          entity,
          score,
          matchedIn: 'title',
          snippet: this.extractSnippet(entity.fullText, query),
        });
      }
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // 2. البحث بالكلمات المفتاحية
  // ═══════════════════════════════════════════════════════════
  private searchByKeyword(query: string, normalizedQuery: string): SearchResult[] {
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    const entities = this.indexer.getEntitiesByKeyword(normalizedQuery);
    for (const entity of entities) {
      if (seen.has(entity.id)) continue;
      seen.add(entity.id);

      results.push({
        entity,
        score: 0.90,
        matchedIn: 'keyword',
        snippet: this.extractSnippet(entity.fullText, query),
      });
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // 3. البحث في النص الكامل (JS Filter)
  // ═══════════════════════════════════════════════════════════
  private searchByFullText(query: string, queryWords: string[]): SearchResult[] {
    const results: SearchResult[] = [];
    const allEntities = this.indexer.getAllEntities();
    const normalizedQuery = this.normalizeText(query);

    for (const entity of allEntities) {
      const normalizedText = this.normalizeText(entity.fullText);
      if (!normalizedText.includes(normalizedQuery)) continue;

      // حساب درجة الصلة: كم كلمة من الاستعلام وجدت؟
      let matchedWords = 0;
      for (const word of queryWords) {
        if (normalizedText.includes(word)) matchedWords++;
      }
      const score = 0.5 + (matchedWords / queryWords.length) * 0.4;

      results.push({
        entity,
        score,
        matchedIn: 'fullText',
        snippet: this.extractSnippet(entity.fullText, query),
      });
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // 4. البحث في الملخص
  // ═══════════════════════════════════════════════════════════
  private searchBySummary(query: string, queryWords: string[]): SearchResult[] {
    const results: SearchResult[] = [];
    const allEntities = this.indexer.getAllEntities();
    const normalizedQuery = this.normalizeText(query);

    for (const entity of allEntities) {
      if (!entity.summary) continue;
      const normalizedSummary = this.normalizeText(entity.summary);
      if (!normalizedSummary.includes(normalizedQuery)) continue;

      results.push({
        entity,
        score: 0.7,
        matchedIn: 'summary',
        snippet: entity.summary.substring(0, 150),
      });
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // أدوات
  // ═══════════════════════════════════════════════════════════

  /**
   * استخراج مقتطف حول الكلمة المطابقة
   */
  private extractSnippet(text: string, query: string, length: number = 180): string {
    const normalizedQuery = this.normalizeText(query);
    const normalizedText = this.normalizeText(text);
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) {
      return text.substring(0, length) + '...';
    }

    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, index + length);
    const snippet = text.substring(start, end);
    return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[أإآا]/g, 'ا')
      .replace(/[ىي]/g, 'ي')
      .replace(/[ةه]/g, 'ه')
      .replace(/[\u064B-\u065F]/g, '')
      .trim();
  }

  private tokenize(text: string): string[] {
    return text
      .split(/[\s،,.:;!?()\[\]{}«»"'-]+/)
      .map(w => this.normalizeText(w))
      .filter(w => w.length >= 2);
  }
}
