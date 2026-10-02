import { describe, it, expect } from 'vitest';
import { CommandParser } from '../../src/bot/CommandParser';

describe('CommandParser', () => {
  const p = new CommandParser();

  it('/start → start', () => {
    expect(p.parse('/start').command).toBe('start');
  });

  it('/help → help', () => {
    expect(p.parse('/help').command).toBe('help');
  });

  it('/analyze محمد → analyze + args', () => {
    const r = p.parse('/analyze محمد');
    expect(r.command).toBe('analyze');
    expect(r.args).toEqual(['محمد']);
  });

  it('/حلل محمد → analyze', () => {
    expect(p.parse('/حلل محمد').command).toBe('analyze');
  });

  it('/compat محمد فاطمة → compat + 2 args', () => {
    const r = p.parse('/compat محمد فاطمة');
    expect(r.command).toBe('compat');
    expect(r.args.length).toBe(2);
  });

  it('/brand نوفا شركة تقنية → brand + 3 args', () => {
    const r = p.parse('/brand نوفا شركة تقنية');
    expect(r.command).toBe('brand');
    expect(r.args.length).toBe(3);
  });

  it('بدون / → analyze تلقائي', () => {
    expect(p.parse('محمد').command).toBe('analyze');
  });

  it('نص فارغ → unknown', () => {
    expect(p.parse('').command).toBe('unknown');
  });

  it('/unknown → unknown command', () => {
    expect(p.parse('/xyz abc').command).toBe('analyze');
  });

  it('حالة الأحرف لا تهم', () => {
    expect(p.parse('/HELP').command).toBe('help');
  });
});
