import { LLMCaller, LLMCallResult } from './LLMCaller';
import { AIContext } from './types';

/**
 * واجهة مختصرة تكفي لربط LLMBridge دون استيراد RN/Expo
 */
export interface BridgeLike {
  generate(
    context: AIContext,
    contextText: string,
    intent: string
  ): Promise<{ answer: string; tokensUsed?: number } | null>;
}

export class LLMBridgeAdapter implements LLMCaller {
  constructor(
    private bridge: BridgeLike,
    private intent: string = 'analytical'
  ) {}

  async generate(systemPrompt: string, userPrompt: string): Promise<LLMCallResult> {
    const context = {
      question: userPrompt,
      entities: [],
      relations: [],
    } as unknown as AIContext;

    const result = await this.bridge.generate(context, systemPrompt, this.intent);

    if (!result || !result.answer) {
      return {
        answer:
          'تعذّر الاتصال بمزوّد الذكاء الاصطناعي. الرجاء تفعيل Gemini أو OpenAI من الإعدادات.',
        tokensUsed: 0,
      };
    }

    return { answer: result.answer, tokensUsed: result.tokensUsed ?? 0 };
  }
}
