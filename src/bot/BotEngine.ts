import { AnalyzeNameUseCase } from '../application/use-cases/AnalyzeNameUseCase';
import { DeepDiveReport } from '../products/DeepDiveReport';
import { CompatibilityEngine } from '../products/CompatibilityEngine';
import { BrandDiagnostic } from '../products/BrandDiagnostic';
import { TemporalTracker } from '../products/TemporalTracker';
import { CommandParser } from './CommandParser';
import { BotMessage, BotReply, ParsedCommand } from './types';

export interface BotEngineDeps {
  analyzeName: AnalyzeNameUseCase;
  deepDive?: DeepDiveReport;
  compatibility?: CompatibilityEngine;
  brand?: BrandDiagnostic;
  temporal?: TemporalTracker;
  parser?: CommandParser;
}

const HELP_TEXT = `🤖 *KnowledgeAtlas Bot*

الأوامر المتاحة:
• /analyze <اسم> — تحليل أساسي
• /compat <اسم1> <اسم2> — توافق
• /brand <اسم> [نشاط] — تشخيص تجاري
• /temporal <اسم> [أيام] — تقويم زمني
• /help — هذه القائمة

مثال: /analyze محمد`;

export class BotEngine {
  private deepDive: DeepDiveReport;
  private compatibility: CompatibilityEngine;
  private brand: BrandDiagnostic;
  private temporal: TemporalTracker;
  private parser: CommandParser;

  constructor(private deps: BotEngineDeps) {
    this.deepDive = deps.deepDive ?? new DeepDiveReport();
    this.compatibility = deps.compatibility ?? new CompatibilityEngine();
    this.brand = deps.brand ?? new BrandDiagnostic();
    this.temporal = deps.temporal ?? new TemporalTracker();
    this.parser = deps.parser ?? new CommandParser();
  }

  async handle(msg: BotMessage): Promise<BotReply> {
    const parsed = this.parser.parse(msg.text);
    try {
      switch (parsed.command) {
        case 'start':
        case 'help':
          return this.reply(msg.chatId, HELP_TEXT);
        case 'analyze':
          return this.handleAnalyze(msg, parsed);
        case 'compat':
          return this.handleCompat(msg, parsed);
        case 'brand':
          return this.handleBrand(msg, parsed);
        case 'temporal':
          return this.handleTemporal(msg, parsed);
        case 'remedy':
          return this.reply(msg.chatId, 'متتبع الالتزام قيد التطوير — تابعنا قريباً.');
        default:
          return this.reply(msg.chatId, 'أمر غير معروف. اكتب /help للقائمة.');
      }
    } catch (e: any) {
      return this.reply(msg.chatId, `⚠️ حدث خطأ: ${e?.message ?? 'unknown'}`);
    }
  }

  private reply(chatId: string, text: string): BotReply {
    return { chatId, text, parseMode: 'markdown' };
  }

  private handleAnalyze(msg: BotMessage, parsed: ParsedCommand): BotReply {
    const name = parsed.args.join(' ').trim();
    if (!name) return this.reply(msg.chatId, 'استخدم: /analyze اسمك');

    const a = this.deps.analyzeName.execute({ name });
    if (a.status === 'abstained') {
      return this.reply(msg.chatId, `⚠️ تعذّر التحليل:\n\n${a.report}`);
    }

    const out = this.deepDive.generate(a, 'personal');
    const short = out.markdown.length > 3500
      ? out.markdown.slice(0, 3500) + '\n\n_...اقتُطع_'
      : out.markdown;
    return this.reply(msg.chatId, short);
  }

  private handleCompat(msg: BotMessage, parsed: ParsedCommand): BotReply {
    if (parsed.args.length < 2) {
      return this.reply(msg.chatId, 'استخدم: /compat اسم1 اسم2');
    }
    const [nameA, ...rest] = parsed.args;
    const nameB = rest.join(' ').trim();

    const a = this.deps.analyzeName.execute({ name: nameA });
    const b = this.deps.analyzeName.execute({ name: nameB });
    const out = this.compatibility.compare(a, b);
    return this.reply(msg.chatId, out.markdown);
  }

  private handleBrand(msg: BotMessage, parsed: ParsedCommand): BotReply {
    const name = parsed.args[0];
    if (!name) return this.reply(msg.chatId, 'استخدم: /brand اسم [نشاط]');
    const activity = parsed.args.slice(1).join(' ').trim() || undefined;

    const a = this.deps.analyzeName.execute({ name });
    const out = this.brand.analyze(a, activity);
    return this.reply(msg.chatId, out.markdown);
  }

  private handleTemporal(msg: BotMessage, parsed: ParsedCommand): BotReply {
    const name = parsed.args[0];
    if (!name) return this.reply(msg.chatId, 'استخدم: /temporal اسم [أيام]');
    const daysArg = parsed.args[1];
    const days = daysArg ? parseInt(daysArg, 10) : 28;
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 90) : 28;

    const a = this.deps.analyzeName.execute({ name });
    const out = this.temporal.generate(a, new Date(), safeDays);
    return this.reply(msg.chatId, out.markdown);
  }
}
