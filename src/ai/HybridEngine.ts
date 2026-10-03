import { AnalyzeNameUseCase, AnalysisResult } from '../application/use-cases/AnalyzeNameUseCase';
import { EthicalGuardrails, ethicalGuardrails } from './EthicalGuardrails';
import { ContextAwarePrompter, ContextMode, contextAwarePrompter } from './ContextAwarePrompter';
import { NarrativeWeaver, narrativeWeaver } from './NarrativeWeaver';
import { LLMCaller } from './LLMCaller';

export type EngineLayer = 'A' | 'B' | 'C';

export interface HybridEngineInput {
  question: string;
  mode?: ContextMode;
  nameForAnalysis?: string;
}

export interface HybridEngineOutput {
  answer: string;
  offline: boolean;
  layer: EngineLayer;
  analysis?: AnalysisResult;
  warnings: string[];
}

export interface HybridEngineDeps {
  analyzer: AnalyzeNameUseCase;
  prompter?: ContextAwarePrompter;
  weaver?: NarrativeWeaver;
  guardrails?: EthicalGuardrails;
  llmCaller?: LLMCaller;
}

export class HybridEngine {
  private prompter: ContextAwarePrompter;
  private weaver: NarrativeWeaver;
  private guardrails: EthicalGuardrails;
  private llmCaller?: LLMCaller;

  constructor(private deps: HybridEngineDeps) {
    this.prompter = deps.prompter ?? contextAwarePrompter;
    this.weaver = deps.weaver ?? narrativeWeaver;
    this.guardrails = deps.guardrails ?? ethicalGuardrails;
    this.llmCaller = deps.llmCaller;
  }

  async process(input: HybridEngineInput): Promise<HybridEngineOutput> {
    const mode: ContextMode = input.mode ?? 'personal';

    // Gate 1: الأخلاقيات على المدخل
    const inputGuard = this.guardrails.checkInput(input.question);
    if (!inputGuard.allowed) {
      return {
        answer: `لا يمكنني معالجة هذا السؤال. ${inputGuard.reason ?? ''}`,
        offline: true,
        layer: 'A',
        warnings: inputGuard.warnings,
      };
    }

    // تحليل الاسم إن وُجد
    let analysis: AnalysisResult | undefined;
    if (input.nameForAnalysis) {
      analysis = this.deps.analyzer.execute({ name: input.nameForAnalysis });
      if (analysis.status === 'abstained') {
        return {
          answer: analysis.report,
          offline: true,
          layer: 'A',
          analysis,
          warnings: analysis.abstention.messages,
        };
      }
    }

    // ═══════════════════════════════════════════════════════
    // Layer B: LLM — يميّز بين محادثة عادية وتحليل
    // ═══════════════════════════════════════════════════════
    if (this.llmCaller) {
      try {
        let systemPrompt: string;
        let userPrompt: string;

        if (analysis) {
          // ─── حالة التحليل: نستخدم Prompt التحليل ───
          const prompt = this.prompter.buildPrompt(mode, analysis, input.question);
          systemPrompt = prompt.systemPrompt;
          userPrompt = prompt.userPrompt;
        } else {
          // ─── حالة محادثة عامة: Prompt مبسّط ───
          systemPrompt = [
            'أنت "مساعد KnowledgeAtlas" — مساعد ذكي ودود بالعربية.',
            '',
            'قواعد صارمة:',
            '1. رد بالعربية الفصحى المبسطة.',
            '2. لا تخترع تحليلات أو أرقاماً أو أسماء كواكب/أبراج.',
            '3. إذا سألك المستخدم عن اسم معيّن (حلل محمد)، اطلب منه صياغة أوضح: "حلل شخصية محمد".',
            '4. إذا سألك عن الجفر أو المعرفة، أجب بمعلومات عامة عن النظام.',
            '5. إذا كان السؤال ترحيباً (سلام، مرحبا)، رد بترحيب ودود واسأل كيف يمكنك المساعدة.',
            '6. لا تكرر السؤال ولا تستخدم صيغة "### ملخص الطبع".',
            '7. أجب بشكل طبيعي وموجز.',
          ].join('\n');
          userPrompt = input.question;
        }

        const llmResp = await this.llmCaller.generate(systemPrompt, userPrompt);
        const outGuard = this.guardrails.checkOutput(llmResp.answer);
        return {
          answer: outGuard.sanitized ?? llmResp.answer,
          offline: false,
          layer: 'B',
          analysis,
          warnings: outGuard.warnings,
        };
      } catch {
        // نسقط إلى Layer A
      }
    }

    // ═══════════════════════════════════════════════════════
    // Layer A: Offline Reasoning
    // ═══════════════════════════════════════════════════════
    if (analysis) {
      const narrative = this.weaver.weave(analysis, mode);
      const outGuard = this.guardrails.checkOutput(narrative);
      return {
        answer: outGuard.sanitized ?? narrative,
        offline: true,
        layer: 'A',
        analysis,
        warnings: outGuard.warnings,
      };
    }

    // لا تحليل ولا LLM — رد عام
    return {
      answer: 'للمساعدة في تحليل اسم أو استشارة، اكتب مثلاً:\n- "حلل شخصية محمد"\n- "ما هو علم الجفر؟"\n\nلتفعيل الردود الذكية، افتح الإعدادات وأضف مفتاح Groq أو Gemini.',
      offline: true,
      layer: 'A',
      warnings: [],
    };
  }
}
