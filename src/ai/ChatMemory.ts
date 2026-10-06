export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

class ChatMemory {
  private turns: ChatTurn[] = [];
  private maxTurns = 12;         // 6 أسئلة + 6 ردود
  private currentName: string | null = null;

  add(role: 'user' | 'assistant', content: string): void {
    this.turns.push({ role, content, ts: new Date().toISOString() });
    if (this.turns.length > this.maxTurns) {
      this.turns = this.turns.slice(-this.maxTurns);
    }
  }

  get(): ChatTurn[] {
    return [...this.turns];
  }

  clear(): void {
    this.turns = [];
    this.currentName = null;
  }

  setName(name: string | null): void {
    this.currentName = name;
  }

  getName(): string | null {
    return this.currentName;
  }

  // يحوّل الـhistory إلى نص للـprompt
  toPrompt(): string {
    if (this.turns.length === 0) return '';
    return this.turns
      .map((t) => `${t.role === 'user' ? 'المستخدم' : 'المساعد'}: ${t.content}`)
      .join('\n\n');
  }

  // آخر N ردود فقط (للتوفير)
  lastN(n: number): ChatTurn[] {
    return this.turns.slice(-n);
  }
}

export const chatMemory = new ChatMemory();
