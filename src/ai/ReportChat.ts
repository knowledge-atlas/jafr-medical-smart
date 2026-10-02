import { LLMCaller, LLMCallResult } from './LLMCaller';
import { ConversationMemory, ConversationTurn } from './ConversationMemory';
import { DeepDiveOutput } from '../products/DeepDiveReport';
import { ContextMode } from './ContextAwarePrompter';
import { EthicalGuardrails, ethicalGuardrails } from './EthicalGuardrails';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokensUsed?: number;
  warning?: string;
}

export interface ReportChatContext {
  report: DeepDiveOutput;
  mode: ContextMode;
}

const CHAT_SYSTEM_PROMPT = (ctx: ReportChatContext) => {
  const summary = ctx.report.sections
    .slice(0, 20)
    .map((s) => `### ${s.title}\n${s.content.slice(0, 400)}`)
    .join('\n\n');

  return `أنت خبير في نظام الجفر الطبي الذكي، وتجيب على أسئلة صاحب الاسم "${ctx.report.name}" حول تقريره العميق.

## سياق التقرير الكامل
${summary}

## قواعد الإجابة
1. اعتمد فقط على ما في التقرير أعلاه.
2. اذكر رقم القسم أو اسمه عند الإشارة له.
3. إذا كان السؤال خارج نطاق التقرير، قل ذلك بوضوح.
4. لا تُعطي تشخيصاً طبياً — أشر لاستشارة مختص.
5. لا تُعطي فتوى دينية — أشر لاستشارة شيخ.
6. النبرة: ${ctx.mode === 'personal' ? 'شخصية ودودة' : ctx.mode === 'marital' ? 'موجهة للعلاقة' : ctx.mode === 'professional' ? 'احترافية' : 'تجارية'}.
7. اكتب بالعربية الفصحى المبسطة.

## أمثلة أسئلة شائعة
- "لماذا جذري 2؟"
- "ما الفرق بين Schism والظل؟"
- "كيف أطبّق الترياق عملياً؟"
- "ما أقوى محور عندي ولماذا؟"
- "اشرح لي قسم الرنين"
- "ما أيام الذروة القادمة؟"`;
};

export interface ReportChatDeps {
  llmCaller?: LLMCaller;
  guardrails?: EthicalGuardrails;
}

export class ReportChat {
  private memory: ConversationMemory;
  private llmCaller?: LLMCaller;
  private guardrails: EthicalGuardrails;
  private ctx: ReportChatContext | null = null;

  constructor(deps: ReportChatDeps = {}) {
    this.memory = new ConversationMemory(20);
    this.llmCaller = deps.llmCaller;
    this.guardrails = deps.guardrails ?? ethicalGuardrails;
  }

  loadReport(report: DeepDiveOutput, mode: ContextMode = 'personal'): void {
    this.ctx = { report, mode };
    this.memory.clear();
  }

  getReportName(): string | null {
    return this.ctx?.report.name ?? null;
  }

  isLoaded(): boolean {
    return this.ctx !== null;
  }

  getHistory(): ChatMessage[] {
    return this.memory.getHistory().map((t) => ({
      role: t.role as ChatMessage['role'],
      content: t.content,
      timestamp: t.timestamp,
    }));
  }

  clear(): void {
    this.memory.clear();
  }

  async ask(question: string): Promise<ChatMessage> {
    if (!this.ctx) {
      return {
        role: 'assistant',
        content: '⚠️ لم يتم تحميل أي تقرير بعد. افتح تقريراً أولاً.',
        timestamp: Date.now(),
      };
    }

    const inputGuard = this.guardrails.checkInput(question);
    if (!inputGuard.allowed) {
      return {
        role: 'assistant',
        content: `⚠️ **لا يمكنني الإجابة على هذا السؤال.**\n\n${inputGuard.reason ?? ''}`,
        timestamp: Date.now(),
        warning: 'ethical_guardrail',
      };
    }

    this.memory.add('user', question);

    if (!this.llmCaller) {
      const fallback = this.buildOfflineAnswer(question);
      this.memory.add('assistant', fallback);
      return {
        role: 'assistant',
        content: fallback,
        timestamp: Date.now(),
      };
    }

    const systemPrompt = CHAT_SYSTEM_PROMPT(this.ctx);
    const historyPrompt = this.memory.toPrompt();
    const userPrompt = `${historyPrompt}\n\n**سؤال جديد:** ${question}`;

    try {
      const result: LLMCallResult = await this.llmCaller.generate(systemPrompt, userPrompt);
      const guard = this.guardrails.checkOutput(result.answer);
      const answer = guard.sanitized ?? result.answer;
      this.memory.add('assistant', answer);
      return {
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
        tokensUsed: result.tokensUsed,
        warning: guard.warnings.length > 0 ? guard.warnings.join(' · ') : undefined,
      };
    } catch (e: any) {
      const errorMsg = `⚠️ تعذّر الاتصال بمزود الذكاء الاصطناعي. ${e?.message ?? ''}`;
      this.memory.add('assistant', errorMsg);
      return {
        role: 'assistant',
        content: errorMsg,
        timestamp: Date.now(),
      };
    }
  }

  /** إجابة بديلة تعمل محلياً بدون LLM */
  private buildOfflineAnswer(question: string): string {
    if (!this.ctx) return '';
    const q = question.toLowerCase();
    const report = this.ctx.report;

    if (q.includes('جذر') || q.includes('root')) {
      const identity = report.sections.find((s) => s.id === 'identity');
      return `**من التقرير:**\n\n${identity?.content ?? '—'}\n\n_لتفعيل الإجابات الذكية الكاملة، فعّل Gemini أو OpenAI من الإعدادات._`;
    }
    if (q.includes('رنين') || q.includes('resonance')) {
      const res = report.sections.find((s) => s.id === 'resonance');
      return `**قسم الرنين:**\n\n${res?.content.slice(0, 800) ?? '—'}\n\n_لتفعيل الذكاء الكامل، فعّل مفتاح API._`;
    }
    if (q.includes('ترياق') || q.includes('remedy')) {
      const rx = report.sections.find((s) => s.id === 'recommendations');
      return `**التوصيات:**\n\n${rx?.content ?? '—'}`;
    }
    return `هذا سؤال يتطلب ذكاءً اصطناعياً. الوضع الحالي محلي فقط.\n\nالأقسام المتاحة في التقرير:\n${report.sections.map((s) => `- ${s.title}`).join('\n')}\n\n_فعّل Gemini أو OpenAI من الإعدادات._`;
  }
}

export const reportChat = new ReportChat();
