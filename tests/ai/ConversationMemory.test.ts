import { describe, it, expect } from 'vitest';
import { ConversationMemory } from '../../src/ai/ConversationMemory';

describe('ConversationMemory', () => {
  it('يبدأ فارغاً', () => {
    const m = new ConversationMemory();
    expect(m.size()).toBe(0);
    expect(m.toPrompt()).toBe('');
  });

  it('يُضاف دور مستخدم', () => {
    const m = new ConversationMemory();
    m.add('user', 'مرحباً');
    expect(m.size()).toBe(1);
    expect(m.lastUser()).toBe('مرحباً');
  });

  it('toPrompt يحوي الوسمين', () => {
    const m = new ConversationMemory();
    m.add('user', 'سؤال');
    m.add('assistant', 'جواب');
    const p = m.toPrompt();
    expect(p).toContain('مستخدم: سؤال');
    expect(p).toContain('مساعد: جواب');
  });

  it('يُحدّ من عدد الأدوار', () => {
    const m = new ConversationMemory(3);
    for (let i = 0; i < 5; i++) m.add('user', `t${i}`);
    expect(m.size()).toBe(3);
    expect(m.getHistory()[0].content).toBe('t2');
  });

  it('clear يفرّغ الذاكرة', () => {
    const m = new ConversationMemory();
    m.add('user', 'x');
    m.clear();
    expect(m.size()).toBe(0);
  });

  it('lastUser يتخطى ردود المساعد', () => {
    const m = new ConversationMemory();
    m.add('user', 'أ');
    m.add('assistant', 'ب');
    m.add('user', 'ج');
    m.add('assistant', 'د');
    expect(m.lastUser()).toBe('ج');
  });

  it('lastUser يرجع null بدون أدوار مستخدم', () => {
    const m = new ConversationMemory();
    m.add('assistant', 'أ');
    expect(m.lastUser()).toBeNull();
  });
});
