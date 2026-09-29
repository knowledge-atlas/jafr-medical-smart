// ================================================================
// موجّه الاستعلامات — نسخة مصححة تتوافق مع buildReport الحالي
// ================================================================

import { KnowledgeBase } from '../kb';
import { IntentClassifier } from './IntentClassifier';
import { contextBuilder } from './ContextBuilder';
import { llmBridge } from './LLMBridge';
import { IntentResult, AIResponse, Source } from './types';
import { SearchResult } from '../kb/types';
import { buildReport } from '../engine/reportBuilder';

// خرائط الاسم ← رقم الكيان في KB
const PLANET_NUM: Record<string, number> = {
  'شمس': 1, 'الشمس': 1,
  'قمر': 2, 'القمر': 2,
  'عطارد': 3,
  'زهرة': 4, 'الزهرة': 4,
  'مريخ': 5, 'المريخ': 5,
  'مشتري': 6, 'المشتري': 6,
  'زحل': 7,
  'أورانوس': 8,
  'نبتون': 9,
  'بلوتو': 10,
};

const SIGN_NUM: Record<string, number> = {
  'الحمل': 1, 'الثور': 2, 'الجوزاء': 3, 'السرطان': 4,
  'الأسد': 5, 'العذراء': 6, 'الميزان': 7, 'العقرب': 8,
  'القوس': 9, 'الجدي': 10, 'الدلو': 11, 'الحوت': 12,
};

const ELEMENT_NUM: Record<string, number> = {
  'ناري': 1, 'ترابي': 2, 'هوائي': 3, 'مائي': 4,
  'نار': 1, 'تراب': 2, 'هواء': 3, 'ماء': 4,
};

export class QueryRouter {
  private classifier = new IntentClassifier();

  async route(question: string): Promise<AIResponse> {
    const intentResult = this.classifier.classify(question);

    // ⭐ أولاً: هل السؤال يحتوي على اسم لتحليله؟
    const nameAnalysis = this.tryAnalyzeName(question, intentResult);
    if (nameAnalysis) {
      return nameAnalysis;
    }

    // استعلام مباشر عن كيان
    if (intentResult.intent === 'entity_lookup' && intentResult.confidence > 0.7) {
      return this.handleEntityLookup(question, intentResult);
    }

    // RAG
    if (['analytical', 'therapeutic', 'medical', 'comparative'].includes(intentResult.intent)) {
      return this.handleRAG(question, intentResult);
    }

    return this.handleGeneral(question, intentResult);
  }

  // ═══════════════════════════════════════════════════════════
  // كشف وتحليل الأسماء العربية
  // ═══════════════════════════════════════════════════════════
  private tryAnalyzeName(question: string, intent: IntentResult): AIResponse | null {
    if (!['analytical', 'entity_lookup', 'general'].includes(intent.intent)) {
      return null;
    }

    const patterns = [
      /حلل\s+شخصية\s+([\u0600-\u06FF]{2,20})/,
      /حلّل\s+شخصية\s+([\u0600-\u06FF]{2,20})/,
      /تحليل\s+شخصية\s+([\u0600-\u06FF]{2,20})/,
      /تحليل\s+([\u0600-\u06FF]{2,20})/,
      /شخصية\s+([\u0600-\u06FF]{2,20})/,
      /سمات\s+([\u0600-\u06FF]{2,20})/,
      /صفات\s+([\u0600-\u06FF]{2,20})/,
    ];

    const NOT_A_NAME = new Set([
      'الجذر', 'الكوكب', 'البرج', 'البيت', 'الطبع', 'الباقي',
      'الحرف', 'الشمس', 'القمر', 'عطارد', 'الزهرة', 'المريخ',
      'المشتري', 'زحل', 'أورانوس', 'نبتون', 'بلوتو',
      'الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء',
      'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت',
      'نار', 'تراب', 'هواء', 'ماء', 'ناري', 'ترابي', 'هوائي', 'مائي',
      'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'ما', 'كيف', 'متى',
    ]);

    for (const p of patterns) {
      const m = question.match(p);
      if (m && m[1]) {
        const name = m[1].trim().replace(/[،,.:;!?]/g, '');
        if (NOT_A_NAME.has(name) || name.length < 2) continue;

        const analysis = this.runNameAnalysis(name);
        if (analysis) return analysis;
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // تشغيل محرك تحليل الاسم الكامل
  // ═══════════════════════════════════════════════════════════
  private runNameAnalysis(name: string): AIResponse | null {
    try {
      const report: any = buildReport(name);
      if (!report || report.error) return null;

      // استخراج القيم من البنية الفعلية لـ buildReport
      const rootNum: number = report.root;
      const planetName: string = report.internalPlanet || '';
      const signName: string = report.internalSign || '';
      const elementName: string = report.internalElement || '';
      const houseNum: number = report.internalHouse || 1;
      const houseName: string = report.calculation?.internal?.houseName || `البيت ${houseNum}`;
      const total: number = report.calculation?.total || 0;
      const digitalRoot: number = report.calculation?.digitalRoot || 0;
      const remainders = report.remainders || report.calculation?.remainders || {};

      // الحصول على الكيانات من KB
      const planetNum = PLANET_NUM[planetName] || 1;
      const signNum = SIGN_NUM[signName] || 1;
      const elementNum = ELEMENT_NUM[elementName] || 1;

      const rootEntity = KnowledgeBase.getRoot(rootNum);
      const planetEntity = KnowledgeBase.getPlanet(planetNum);
      const signEntity = KnowledgeBase.getSign(signNum);
      const houseEntity = KnowledgeBase.getHouse(houseNum);
      const elementEntity = KnowledgeBase.getElement(elementNum);

      // بناء المصادر
      const sources: Source[] = [];
      if (rootEntity) {
        sources.push({
          type: 'internal',
          entityId: rootEntity.id,
          entityTitle: rootEntity.titleAr,
          sourceFile: rootEntity.sourceFile,
          sha256: rootEntity.sha256,
          confidence: 1.0,
          snippet: rootEntity.fullText.substring(0, 150),
        });
      }
      if (planetEntity) {
        sources.push({
          type: 'internal',
          entityId: planetEntity.id,
          entityTitle: planetEntity.titleAr,
          sourceFile: planetEntity.sourceFile,
          confidence: 0.9,
          snippet: planetEntity.fullText.substring(0, 100),
        });
      }
      if (signEntity) {
        sources.push({
          type: 'internal',
          entityId: signEntity.id,
          entityTitle: signEntity.titleAr,
          sourceFile: signEntity.sourceFile,
          confidence: 0.9,
          snippet: signEntity.fullText.substring(0, 100),
        });
      }

      // بناء الإجابة الكاملة
      const answerParts: string[] = [];
      answerParts.push(`📜 **تحليل الاسم: ${name}**\n`);
      answerParts.push(`**📊 الميزان العددي:**`);
      answerParts.push(`• المجموع: ${total}`);
      answerParts.push(`• الجذر: ${digitalRoot}`);
      answerParts.push(`• البواقي: 7→${remainders.on7 || '-'} | 9→${remainders.on9 || '-'} | 12→${remainders.on12 || '-'}\n`);

      answerParts.push(`**🎯 التصنيف:**`);
      answerParts.push(`• الكوكب: ${planetName || '—'}`);
      answerParts.push(`• البرج: ${signName || '—'}`);
      answerParts.push(`• الطبع: ${elementName || '—'}`);
      answerParts.push(`• البيت: ${houseName}\n`);

      answerParts.push(`─────────────────────────`);
      answerParts.push(`**🔷 الجذر ${rootNum} — ${rootEntity?.titleAr || ''}**\n`);
      if (rootEntity) {
        const rootText = rootEntity.fullText.length > 1200
          ? rootEntity.fullText.substring(0, 1200) + '\n...[اقرأ المزيد في تبويب البحث]'
          : rootEntity.fullText;
        answerParts.push(rootText);
      }

      answerParts.push(`\n─────────────────────────`);
      answerParts.push(`**☀️ الكوكب: ${planetName}**\n`);
      if (planetEntity) {
        const pText = planetEntity.fullText.length > 700
          ? planetEntity.fullText.substring(0, 700) + '...'
          : planetEntity.fullText;
        answerParts.push(pText);
      }

      answerParts.push(`\n─────────────────────────`);
      answerParts.push(`**♈ البرج: ${signName}**\n`);
      if (signEntity) {
        const sText = signEntity.fullText.length > 500
          ? signEntity.fullText.substring(0, 500) + '...'
          : signEntity.fullText;
        answerParts.push(sText);
      }

      return {
        question: `تحليل ${name}`,
        intent: 'analytical',
        answer: answerParts.join('\n'),
        sources,
        confidence: 0.9,
        offline: true,
        generatedAt: new Date().toISOString(),
        suggestions: [
          `ما هو ظل الجذر ${rootNum}؟`,
          `ما هو ترياق الجذر ${rootNum}؟`,
          `ما هي صفات برج ${signName}؟`,
        ],
      };
    } catch (e: any) {
      console.error('❌ فشل تحليل الاسم:', e.message);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 1. استعلام مباشر
  // ═══════════════════════════════════════════════════════════
  private handleEntityLookup(question: string, intent: IntentResult): AIResponse {
    const results = KnowledgeBase.searchQuery(question, { limit: 3 });
    if (results.length === 0) return this.noResultsResponse(question, intent);

    const topResult = results[0];
    return {
      question,
      intent: intent.intent,
      answer: topResult.entity.fullText,
      sources: [this.entityToSource(topResult)],
      confidence: topResult.score,
      offline: true,
      generatedAt: new Date().toISOString(),
      suggestions: this.generateSuggestions(topResult),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 2. RAG
  // ═══════════════════════════════════════════════════════════
  private async handleRAG(question: string, intent: IntentResult): Promise<AIResponse> {
    const context = contextBuilder.build(question, intent.intent, intent.entities);
    if (context.entities.length === 0) {
      return this.noResultsResponse(question, intent);
    }

    const contextText = contextBuilder.toPrompt(context);
    const sources: Source[] = context.entities.map((e) => ({
      type: e.sourceType,
      entityId: e.id,
      entityTitle: e.titleAr,
      sourceFile: e.sourceFile,
      sha256: e.sha256,
      confidence: 0.9,
      snippet: e.fullText.substring(0, 150),
    }));

    const llmResult = await llmBridge.generate(context, contextText, intent.intent);

    if (llmResult && llmResult.answer) {
      return {
        question,
        intent: intent.intent,
        answer: llmResult.answer,
        sources,
        confidence: 0.92,
        offline: false,
        generatedAt: new Date().toISOString(),
        suggestions: [],
      };
    }

    const parts: string[] = [];
    parts.push(`**${this.intentLabel(intent.intent)}**\n`);
    parts.push(`> ${question}\n`);
    parts.push('─── من قاعدة المعرفة ───\n');

    context.entities.slice(0, 3).forEach((e, idx) => {
      parts.push(`\n◈ [${idx + 1}] ${e.titleAr} ◈\n`);
      parts.push(e.fullText);
    });

    return {
      question,
      intent: intent.intent,
      answer: parts.join('\n'),
      sources,
      confidence: 0.85,
      offline: true,
      generatedAt: new Date().toISOString(),
      suggestions: [],
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 3. سؤال عام
  // ═══════════════════════════════════════════════════════════
  private handleGeneral(question: string, intent: IntentResult): AIResponse {
    const results = KnowledgeBase.searchQuery(question, { limit: 3 });
    if (results.length === 0) return this.noResultsResponse(question, intent);

    return {
      question,
      intent: intent.intent,
      answer: `تم العثور على ${results.length} نتيجة:\n\n` +
        results.map(r => `• **${r.entity.titleAr}**: ${r.snippet}`).join('\n\n'),
      sources: results.map(r => this.entityToSource(r)),
      confidence: results[0].score,
      offline: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // أدوات
  // ═══════════════════════════════════════════════════════════
  private entityToSource(r: SearchResult): Source {
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

  private noResultsResponse(question: string, intent: IntentResult): AIResponse {
    return {
      question,
      intent: intent.intent,
      answer: '⚠️ لم أجد معلومات مطابقة في قاعدة المعرفة.\n\nجرّب:\n• ذكر الكيان بوضوح (مثل: "الجذر 2" أو "برج الأسد")\n• إعادة صياغة السؤال\n• التحقق من الإملاء\n• لتحليل اسم: "حلل شخصية محمد"',
      sources: [],
      confidence: 0,
      offline: true,
      generatedAt: new Date().toISOString(),
      suggestions: ['ما هو الجذر 1؟', 'ما هي صفات برج الأسد؟', 'حلل شخصية محمد'],
    };
  }

  private intentLabel(intent: string): string {
    const labels: Record<string, string> = {
      analytical: '🔍 تحليل',
      therapeutic: '💊 علاج',
      medical: '🏥 تحليل طبي',
      comparative: '⚖️ مقارنة',
      entity_lookup: '📖 استعلام',
      general: '💬 سؤال عام',
    };
    return labels[intent] || '📖 استعلام';
  }

  private generateSuggestions(top: SearchResult): string[] {
    const suggestions: string[] = [];
    if (top.entity.entityType === 'root') {
      suggestions.push('ما هو ظل هذا الجذر؟');
      suggestions.push('ما هو ترياقه؟');
    }
    if (top.entity.entityType === 'sign') {
      suggestions.push('ما هو الكوكب الحاكم لهذا البرج؟');
    }
    return suggestions.slice(0, 3);
  }
}

export const queryRouter = new QueryRouter();
