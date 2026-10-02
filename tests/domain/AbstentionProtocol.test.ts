import { describe, it, expect } from 'vitest';
import { AbstentionProtocol } from '../../src/domain/services/AbstentionProtocol';

describe('AbstentionProtocol', () => {
  const p = new AbstentionProtocol();

  it('1. valid Arabic name + high confidence → no abstain', () => {
    const r = p.check({ name: 'محمد', confidence: 0.85 });
    expect(r.shouldAbstain).toBe(false);
    expect(r.reasons).toEqual([]);
  });

  it('2. confidence below threshold → LOW_CONFIDENCE', () => {
    const r = p.check({ name: 'محمد', confidence: 0.3 });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('LOW_CONFIDENCE');
  });

  it('3. confidence at exact threshold → no abstain', () => {
    expect(p.check({ name: 'محمد', confidence: 0.5 }).shouldAbstain).toBe(false);
  });

  it('4. confidence just below threshold → abstain', () => {
    expect(p.check({ name: 'محمد', confidence: 0.49 }).shouldAbstain).toBe(true);
  });

  it('5. non-Arabic name John → NON_ARABIC_NAME', () => {
    const r = p.check({ name: 'John', confidence: 0.85 });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('NON_ARABIC_NAME');
  });

  it('6. transliterated name جون → no abstain', () => {
    expect(p.check({ name: 'جون', confidence: 0.85 }).shouldAbstain).toBe(false);
  });

  it('7. name with digits → UNKNOWN_CHARACTERS', () => {
    const r = p.check({ name: 'محمد123', confidence: 0.85 });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('UNKNOWN_CHARACTERS');
  });

  it('8. name with symbols → UNKNOWN_CHARACTERS', () => {
    const r = p.check({ name: 'محمد!', confidence: 0.85 });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('UNKNOWN_CHARACTERS');
  });

  it('9. name with space → no abstain', () => {
    expect(p.check({ name: 'عبد الرحمن', confidence: 0.85 }).shouldAbstain).toBe(false);
  });

  it('10. layerConsistency < 0.30 → RADICAL_CONFLICT', () => {
    const r = p.check({ name: 'محمد', confidence: 0.85, layerConsistency: 0.2 });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('RADICAL_CONFLICT');
  });

  it('11. layerConsistency = 0.30 → no abstain', () => {
    expect(
      p.check({ name: 'محمد', confidence: 0.85, layerConsistency: 0.3 }).shouldAbstain
    ).toBe(false);
  });

  it('12. explicit hasRadicalConflict → RADICAL_CONFLICT', () => {
    const r = p.check({ name: 'محمد', confidence: 0.85, hasRadicalConflict: true });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('RADICAL_CONFLICT');
  });

  it('13. 2+ negative feedbacks → FEEDBACK_CONTRADICTION', () => {
    const r = p.check({
      name: 'محمد',
      confidence: 0.85,
      currentPattern: 'root_1:planet_2:sign_3',
      feedbackHistory: [
        { pattern: 'root_1:planet_2:sign_3', wasAccurate: false },
        { pattern: 'root_1:planet_2:sign_3', wasAccurate: false },
      ],
    });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons).toContain('FEEDBACK_CONTRADICTION');
  });

  it('14. one negative feedback → no abstain', () => {
    const r = p.check({
      name: 'محمد',
      confidence: 0.85,
      currentPattern: 'root_1:planet_2:sign_3',
      feedbackHistory: [{ pattern: 'root_1:planet_2:sign_3', wasAccurate: false }],
    });
    expect(r.shouldAbstain).toBe(false);
  });

  it('15. positive feedbacks → no abstain', () => {
    const r = p.check({
      name: 'محمد',
      confidence: 0.85,
      currentPattern: 'root_1:planet_2:sign_3',
      feedbackHistory: [
        { pattern: 'root_1:planet_2:sign_3', wasAccurate: true },
        { pattern: 'root_1:planet_2:sign_3', wasAccurate: true },
      ],
    });
    expect(r.shouldAbstain).toBe(false);
  });

  it('16. multiple rules fire together', () => {
    const r = p.check({ name: 'John123', confidence: 0.2, layerConsistency: 0.1 });
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('17. messages count matches reasons count', () => {
    const r = p.check({ name: 'John', confidence: 0.3 });
    expect(r.messages.length).toBe(r.reasons.length);
    r.messages.forEach((m) => expect(typeof m).toBe('string'));
  });

  it('18. custom threshold respected', () => {
    const strict = new AbstentionProtocol(0.8);
    expect(strict.check({ name: 'محمد', confidence: 0.7 }).shouldAbstain).toBe(true);
  });

  it('19. name with hamza (أحمد) → no abstain', () => {
    expect(p.check({ name: 'أحمد', confidence: 0.85 }).shouldAbstain).toBe(false);
  });

  it('20. empty feedback history → no FEEDBACK_CONTRADICTION', () => {
    const r = p.check({
      name: 'محمد',
      confidence: 0.85,
      currentPattern: 'any',
      feedbackHistory: [],
    });
    expect(r.shouldAbstain).toBe(false);
  });
});
