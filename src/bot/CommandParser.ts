import { BotCommand, ParsedCommand } from './types';

const ALIASES: Record<string, BotCommand> = {
  '/start': 'start',
  '/help': 'help',
  '/analyze': 'analyze',
  '/حلل': 'analyze',
  '/compat': 'compat',
  '/قارن': 'compat',
  '/brand': 'brand',
  '/تجاري': 'brand',
  '/temporal': 'temporal',
  '/زمني': 'temporal',
  '/remedy': 'remedy',
  '/توصيات': 'remedy',
};

export class CommandParser {
  parse(raw: string): ParsedCommand {
    const text = (raw ?? '').trim();
    if (!text) return { command: 'unknown', args: [], raw: text };

    const tokens = text.split(/\s+/);
    const first = tokens[0].toLowerCase();

    const cmd = ALIASES[first];
    if (!cmd) {
      // بدون / → نعتبره طلب تحليل تلقائي
      return { command: 'analyze', args: tokens, raw: text };
    }

    return { command: cmd, args: tokens.slice(1), raw: text };
  }
}
