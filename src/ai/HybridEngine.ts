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

    // Layer B: LLM (إن مُرّر caller)
    if (this.llmCaller) {
      try {
        const prompt = this.prompter.buildPrompt(mode, analysis ?? null, input.question);
        const llmResp = await this.llmCaller.generate(prompt.systemPrompt, prompt.userPrompt);
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

    // Layer A: Offline Reasoning
    const narrative = analysis
      ? this.weaver.weave(analysis, mode)
      : 'لم أتمكن من توليد تحليل. الرجاء تحديد اسم صريح.';
    const outGuard = this.guardrails.checkOutput(narrative);
    return {
      answer: outGuard.sanitized ?? narrative,
      offline: true,
      layer: 'A',
      analysis,
      warnings: outGuard.warnings,
    };
  }
}
