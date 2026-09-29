// ================================================================
// باني السياق — يجمع المعلومات من KB قبل إرسالها لـ LLM
// ================================================================

import { KnowledgeBase } from '../kb';
import { KnowledgeEntity, SearchResult } from '../kb/types';
import { AIContext, Intent, Source } from './types';

export class ContextBuilder {
  /**
   * بناء السياق الكامل لسؤال
   */
  build(question: string, intent: Intent, entities: string[] = []): AIContext {
    // 1. البحث الشامل
    const searchResults = KnowledgeBase.searchQuery(question, { limit: 8 });

    // 2. استخراج الكيانات من النتائج
    const relevantEntities: KnowledgeEntity[] = searchResults.map(r => r.entity);

    // 3. جمع العلاقات
    const relations: any[] = [];
    for (const entity of relevantEntities.slice(0, 3)) {
      const rels = KnowledgeBase.getRelations(entity.id);
      relations.push(...rels.from.map(r => ({ ...r, direction: 'from', entityTitle: entity.titleAr })));
      relations.push(...rels.to.map(r => ({ ...r, direction: 'to', entityTitle: entity.titleAr })));
    }

    // 4. المصادر (حالياً داخلية فقط — الخارجية في جولة قادمة)
    const sources: Source[] = searchResults.map(r => this.toSource(r));

    return {
      question,
      intent,
      entities: relevantEntities,
      relations: relations.slice(0, 15), // حد أقصى 15 علاقة
      externalSources: [],
    };
  }

  /**
   * تحويل السياق إلى نص مُهيّأ لـ LLM
   */
  toPrompt(context: AIContext, maxLength: number = 8000): string {
    const parts: string[] = [];

    parts.push('═══ السياق من قاعدة المعرفة ═══\n');

    // الكيانات
    for (let i = 0; i < context.entities.length; i++) {
      const e = context.entities[i];
      parts.push(`\n───── [${i + 1}] ${e.titleAr} (${e.entityType}) ─────`);
      // نقتطع النص إن كان طويلاً جداً
      const text = e.fullText.length > 2000 ? e.fullText.substring(0, 2000) + '...[مقتطع]' : e.fullText;
      parts.push(text);
    }

    // العلاقات
    if (context.relations.length > 0) {
      parts.push('\n\n═══ العلاقات ذات الصلة ═══');
      for (const rel of context.relations.slice(0, 10)) {
        parts.push(`• ${rel.entityTitle} → ${rel.relationType} → ${rel.targetEntityId}`);
      }
    }

    let result = parts.join('\n');

    // قطع في حال تجاوز الحد
    if (result.length > maxLength) {
      result = result.substring(0, maxLength) + '\n...[السياق مقتطع لأسباب تقنية]';
    }

    return result;
  }

  private toSource(r: SearchResult): Source {
    return {
      type: r.entity.sourceType,
      entityId: r.entity.id,
      entityTitle: r.entity.titleAr,
      sourceFile: r.entity.sourceFile,
      sha256: r.entity.sha256,
      confidence: r.score,
      snippet: r.snippet,
    };
  }
}

export const contextBuilder = new ContextBuilder();
