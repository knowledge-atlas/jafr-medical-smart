// ================================================================
// مُنسّق الإجابة — يفصل المصادر ويضيف التوقيعات
// ================================================================

import { AIResponse, Source } from './types';

export class ResponseFormatter {
  /**
   * تنسيق الإجابة النهائية مع فصل المصادر
   */
  format(response: AIResponse): string {
    const parts: string[] = [];

    // 1. الإجابة الأساسية
    parts.push(response.answer.trim());

    // 2. المصادر (منفصلة بوضوح)
    if (response.sources.length > 0) {
      parts.push('\n\n═══════════════════════════════════');
      parts.push('📚 المصادر:');
      parts.push('═══════════════════════════════════');

      const internal = response.sources.filter(s => s.type === 'internal');
      const external = response.sources.filter(s => s.type === 'external');

      if (internal.length > 0) {
        parts.push('\n🟢 من قاعدة المعرفة الداخلية:');
        internal.forEach((s, i) => {
          parts.push(`   [${i + 1}] ${s.entityTitle || 'غير معنون'}`);
          parts.push(`       الملف: ${s.sourceFile || '—'}`);
          if (s.sha256) {
            parts.push(`       البصمة: ${s.sha256.substring(0, 16)}...`);
          }
          parts.push(`       الثقة: ${(s.confidence * 100).toFixed(0)}%`);
        });
      }

      if (external.length > 0) {
        parts.push('\n🟡 من المصادر الخارجية:');
        external.forEach((s, i) => {
          parts.push(`   [${i + 1}] ${s.entityTitle || s.url || 'مصدر خارجي'}`);
          parts.push(`       الرابط: ${s.url || '—'}`);
          parts.push(`       الثقة: ${(s.confidence * 100).toFixed(0)}%`);
        });
      }
    }

    // 3. توقيع الوضع
    parts.push('\n───────────────────────────────────');
    parts.push(response.offline
      ? '💡 تم توليد هذه الإجابة محلياً من قاعدة المعرفة.'
      : '🌐 تم توليد هذه الإجابة بالتعاون مع الذكاء الاصطناعي.');

    if (response.suggestions && response.suggestions.length > 0) {
      parts.push('\n\n🔮 أسئلة مقترحة:');
      response.suggestions.forEach(s => parts.push(`   • ${s}`));
    }

    return parts.join('\n');
  }

  /**
   * تنسيق مختصر للعرض في بطاقة
   */
  formatBrief(response: AIResponse, maxLength: number = 200): string {
    const text = response.answer.replace(/\*\*/g, '').replace(/\n+/g, ' ');
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}

export const responseFormatter = new ResponseFormatter();
