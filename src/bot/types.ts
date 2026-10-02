export interface BotMessage {
  chatId: string;
  userId: string;
  text: string;
  timestamp: number;
  userName?: string;
}

export interface BotReply {
  chatId: string;
  text: string;
  parseMode?: 'markdown' | 'plain';
  buttons?: Array<Array<{ label: string; value: string }>>;
}

export interface BotAdapter {
  /** يُرسل رسالة إلى المستخدم */
  send(reply: BotReply): Promise<void>;
  /** اسم المنصة (للتشخيص) */
  platform(): string;
}

export type BotCommand =
  | 'start'
  | 'help'
  | 'analyze'
  | 'compat'
  | 'brand'
  | 'temporal'
  | 'remedy'
  | 'unknown';

export interface ParsedCommand {
  command: BotCommand;
  args: string[];
  raw: string;
}
