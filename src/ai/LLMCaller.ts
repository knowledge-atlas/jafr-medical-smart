export interface LLMCallResult {
  answer: string;
  tokensUsed?: number;
}

export interface LLMCaller {
  generate(systemPrompt: string, userPrompt: string): Promise<LLMCallResult>;
}

export class DemoLLMCaller implements LLMCaller {
  async generate(_system: string, user: string): Promise<LLMCallResult> {
    return {
      answer: `[وضع تجريبي] استلمت سؤالك: "${user.slice(0, 80)}". لم يتم الاتصال بأي مزوّد.`,
      tokensUsed: 0,
    };
  }
}
