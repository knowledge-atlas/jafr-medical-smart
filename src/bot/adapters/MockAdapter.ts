import { BotAdapter, BotReply } from '../types';

export class MockAdapter implements BotAdapter {
  public sent: BotReply[] = [];

  async send(reply: BotReply): Promise<void> {
    this.sent.push(reply);
  }

  platform(): string {
    return 'mock';
  }

  last(): BotReply | null {
    return this.sent.length > 0 ? this.sent[this.sent.length - 1] : null;
  }

  clear(): void {
    this.sent = [];
  }
}
