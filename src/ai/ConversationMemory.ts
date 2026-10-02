export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class ConversationMemory {
  private turns: ConversationTurn[] = [];

  constructor(private maxTurns: number = 10) {}

  add(role: 'user' | 'assistant', content: string): void {
    this.turns.push({ role, content, timestamp: Date.now() });
    if (this.turns.length > this.maxTurns) {
      this.turns.splice(0, this.turns.length - this.maxTurns);
    }
  }

  getHistory(): ConversationTurn[] {
    return [...this.turns];
  }

  toPrompt(): string {
    if (this.turns.length === 0) return '';
    return this.turns
      .map((t) => `${t.role === 'user' ? 'مستخدم' : 'مساعد'}: ${t.content}`)
      .join('\n');
  }

  lastUser(): string | null {
    for (let i = this.turns.length - 1; i >= 0; i--) {
      if (this.turns[i].role === 'user') return this.turns[i].content;
    }
    return null;
  }

  size(): number {
    return this.turns.length;
  }

  clear(): void {
    this.turns = [];
  }
}
