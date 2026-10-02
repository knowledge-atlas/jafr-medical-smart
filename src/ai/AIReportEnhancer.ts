import { LLMCaller, LLMCallResult } from './LLMCaller';
import { DeepDiveOutput } from '../products/DeepDiveReport';
import { ContextMode } from './ContextAwarePrompter';
import { EthicalGuardrails, ethicalGuardrails } from './EthicalGuardrails';

export interface EnhancedSection {
  id: string;
  title: string;
  original: string;
  enhanced: string;
  tokensUsed?: number;
  error?: string;
}

export interface EnhancedReport {
  name: string;
  mode: ContextMode;
  sections: EnhancedSection[];
  overallSummary: string;
  totalTokens: number;
  successCount: number;
  failedCount: number;
}

const SECTION_ENHANCE_PROMPT = (mode: ContextMode) => {
  const modeHint: Record<ContextMode, string> = {
    personal: 'اجعل النبرة شخصية مباشرة تخاطب صاحب الاسم.',
    marital: 'اجعل النبرة موجّهة للعلاقة الزوجية كنقاط حوار بين شريكين.',
    professional: 'اجعل النبرة موجّهة للمسار المهني وقرارات العمل.',
    commercial: 'اجعل النبرة موجّهة لصاحب مشروع تجاري أو علامة.',
  };
  return `أنت كاتب تحليلي عربي متخصص في صياغة تقارير الجفر الطبي الذكي.
مهمتك: إعادة صياغة النص الأصلي بإضافة طبقة سردية أعمق، دون تغيير المحتوى الفعلي.

قواعد:
1. لا تخترع أرقاماً أو طبقات غير موجودة.
2. حافظ على المصطلحات: الجذر، الكوكب، البرج، البيت، الطبع.
3. ابدأ بجملة جوهرية واحدة عن هذا القسم.
4. أضف فقرة "لماذا يهمني هذا؟" بجملتين.
5. اختم بسؤال تأملي واحد للقارئ.
6. ${modeHint[mode]}
7. اكتب بالعربية الفصحى المبسطة.`;
};

export interface AIReportEnhancerDeps {
  llmCaller?: LLMCaller;
  guardrails?: EthicalGuardrails;
}

export class AIReportEnhancer {
  private llmCaller?: LLMCaller;
  private guardrails: EthicalGuardrails;

  constructor(deps: AIReportEnhancerDeps = {}) {
    this.llmCaller = deps.llmCaller;
    this.guardrails = deps.guardrails ?? ethicalGuardrails;
  }

  /** يعزز كل قسم من التقرير بنداء منفصل للـ LLM */
  async enhanceReport(
    report: DeepDiveOutput,
    mode: ContextMode = 'personal'
  ): Promise<EnhancedReport> {
    if (!this.llmCaller) {
      return this.buildEmpty(report.name, mode);
    }

    const systemPrompt = SECTION_ENHANCE_PROMPT(mode);
    const enhancedSections: EnhancedSection[] = [];
    let totalTokens = 0;

    for (const section of report.sections) {
      // تخطي الأقسام الطويلة جداً (موسوعة، سجلات) — لا نريد تحسين 6000 كلمة
      if (section.id === 'encyclopedia' || section.id === 'sources' || section.id === 'metadata') {
        enhancedSections.push({
          id: section.id,
          title: section.title,
          original: section.content,
          enhanced: section.content,
        });
        continue;
      }

      const userPrompt = [
        `## القسم: ${section.title}`,
        '',
        '### النص الأصلي',
        section.content.slice(0, 2500),
        '',
        '### المطلوب',
        'أعد صياغة هذا القسم بالطريقة الموضحة في التعليمات.',
      ].join('\n');

      try {
        const result: LLMCallResult = await this.llmCaller.generate(systemPrompt, userPrompt);
        const guard = this.guardrails.checkOutput(result.answer);
        enhancedSections.push({
          id: section.id,
          title: section.title,
          original: section.content,
          enhanced: guard.sanitized ?? result.answer,
          tokensUsed: result.tokensUsed ?? 0,
        });
        totalTokens += result.tokensUsed ?? 0;
      } catch (e: any) {
        enhancedSections.push({
          id: section.id,
          title: section.title,
          original: section.content,
          enhanced: section.content,
          error: e?.message ?? 'unknown error',
        });
      }
    }

    const overallSummary = await this.buildOverallSummary(report, enhancedSections, systemPrompt, mode);
    totalTokens += overallSummary.tokensUsed;

    return {
      name: report.name,
      mode,
      sections: enhancedSections,
      overallSummary: overallSummary.text,
      totalTokens,
      successCount: enhancedSections.filter((s) => !s.error).length,
      failedCount: enhancedSections.filter((s) => s.error).length,
    };
  }

  private async buildOverallSummary(
    report: DeepDiveOutput,
    sections: EnhancedSection[],
    systemPrompt: string,
    mode: ContextMode
  ): Promise<{ text: string; tokensUsed: number }> {
    if (!this.llmCaller) return { text: '', tokensUsed: 0 };

    const userPrompt = [
      `## التقرير العميق لـ "${report.name}"`,
      '',
      '### عناوين الأقسام',
      sections.map((s) => `- ${s.title}`).join('\n'),
      '',
      '### المطلوب',
      'اكتب ملخصاً تنفيذياً واحداً (150 كلمة كحد أقصى) يلخّص جوهر التقرير كاملاً، بأسلوب سردي جذاب يخاطب صاحب الاسم مباشرة.',
    ].join('\n');

    try {
      const result = await this.llmCaller.generate(systemPrompt, userPrompt);
      const guard = this.guardrails.checkOutput(result.answer);
      return {
        text: guard.sanitized ?? result.answer,
        tokensUsed: result.tokensUsed ?? 0,
      };
    } catch {
      return { text: '', tokensUsed: 0 };
    }
  }

  private buildEmpty(name: string, mode: ContextMode): EnhancedReport {
    return {
      name,
      mode,
      sections: [],
      overallSummary: '',
      totalTokens: 0,
      successCount: 0,
      failedCount: 0,
    };
  }

  renderMarkdown(enhanced: EnhancedReport): string {
    const lines: string[] = [];
    lines.push(`# ✨ التقرير المُعزَّز بالذكاء الاصطناعي — ${enhanced.name}`);
    lines.push('');
    lines.push(`> **الأقسام المُعزَّزة:** ${enhanced.successCount} من ${enhanced.sections.length}`);
    lines.push(`> **التوكنز المستخدمة:** ${enhanced.totalTokens}`);
    lines.push('');
    if (enhanced.overallSummary) {
      lines.push('## 📌 الملخص التنفيذي المُعزَّز');
      lines.push('');
      lines.push(enhanced.overallSummary);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    for (const s of enhanced.sections) {
      if (s.original === s.enhanced) continue;
      lines.push(`## ✨ ${s.title}`);
      lines.push('');
      lines.push(s.enhanced);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    return lines.join('\n');
  }
}

export const aiReportEnhancer = new AIReportEnhancer();
