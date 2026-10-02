import { describe, it, expect } from 'vitest';
import {
  ConfidenceEngine,
  ConfidenceDimensions,
} from '../../src/domain/services/ConfidenceEngine';

const makeDims = (overrides: Partial<ConfidenceDimensions> = {}): ConfidenceDimensions => ({
  inputQuality: 1,
  dataCompleteness: 1,
  layerConsistency: 1,
  resonanceStrength: 1,
  wafqClarity: 1,
  verificationHistory: 1,
  ...overrides,
});

describe('ConfidenceEngine', () => {
  const engine = new ConfidenceEngine();

  it('1. returns 1.0 when all dimensions perfect', () => {
    expect(engine.calculateOverall(makeDims())).toBeCloseTo(1.0);
  });

  it('2. returns 0 when all dimensions zero', () => {
    expect(
      engine.calculateOverall(
        makeDims({
          inputQuality: 0,
          dataCompleteness: 0,
          layerConsistency: 0,
          resonanceStrength: 0,
          wafqClarity: 0,
          verificationHistory: 0,
        })
      )
    ).toBeCloseTo(0);
  });

  it('3. inputQuality weight = 0.10', () => {
    const w = engine.calculateOverall(
      makeDims({
        inputQuality: 1,
        dataCompleteness: 0,
        layerConsistency: 0,
        resonanceStrength: 0,
        wafqClarity: 0,
        verificationHistory: 0,
      })
    );
    expect(w).toBeCloseTo(0.1);
  });

  it('4. classifies 0.90 as عالية', () => {
    expect(engine.classify(0.9)).toBe('عالية');
  });

  it('5. classifies 0.80 as عالية (boundary)', () => {
    expect(engine.classify(0.8)).toBe('عالية');
  });

  it('6. classifies 0.79 as متوسطة', () => {
    expect(engine.classify(0.79)).toBe('متوسطة');
  });

  it('7. classifies 0.65 as متوسطة (boundary)', () => {
    expect(engine.classify(0.65)).toBe('متوسطة');
  });

  it('8. classifies 0.64 as ضعيفة', () => {
    expect(engine.classify(0.64)).toBe('ضعيفة');
  });

  it('9. classifies 0.50 as ضعيفة (boundary)', () => {
    expect(engine.classify(0.5)).toBe('ضعيفة');
  });

  it('10. classifies 0.49 as منعدمة', () => {
    expect(engine.classify(0.49)).toBe('منعدمة');
  });

  it('11. classifies 0.00 as منعدمة', () => {
    expect(engine.classify(0)).toBe('منعدمة');
  });

  it('12. no abstention when all dimensions healthy', () => {
    expect(engine.evaluate(makeDims()).shouldAbstain).toBe(false);
  });

  it('13. abstains when overall < threshold', () => {
    const r = engine.evaluate(
      makeDims({
        inputQuality: 0.2,
        dataCompleteness: 0.2,
        layerConsistency: 0.2,
        resonanceStrength: 0.2,
        wafqClarity: 0.2,
        verificationHistory: 0.2,
      })
    );
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons.some((x) => x.includes('الإجمالية'))).toBe(true);
  });

  it('14. abstains when layerConsistency < 0.30', () => {
    const r = engine.evaluate(makeDims({ layerConsistency: 0.25 }));
    expect(r.shouldAbstain).toBe(true);
    expect(r.reasons.some((x) => x.includes('اتساق'))).toBe(true);
  });

  it('15. abstains when dataCompleteness < 0.20', () => {
    const r = engine.evaluate(makeDims({ dataCompleteness: 0.15 }));
    expect(r.shouldAbstain).toBe(true);
  });

  it('16. abstains when inputQuality < 0.10', () => {
    const r = engine.evaluate(makeDims({ inputQuality: 0.05 }));
    expect(r.shouldAbstain).toBe(true);
  });

  it('17. level عالية for strong dims', () => {
    const r = engine.evaluate(
      makeDims({ inputQuality: 0.9, dataCompleteness: 0.9, layerConsistency: 0.9 })
    );
    expect(r.level).toBe('عالية');
  });

  it('18. level ضعيفة for borderline dims', () => {
    const r = engine.evaluate(
      makeDims({
        inputQuality: 0.6,
        dataCompleteness: 0.6,
        layerConsistency: 0.6,
        resonanceStrength: 0.6,
        wafqClarity: 0.6,
        verificationHistory: 0.6,
      })
    );
    expect(r.level).toBe('ضعيفة');
  });

  it('19. level منعدمة for very weak dims', () => {
    const r = engine.evaluate(
      makeDims({
        inputQuality: 0.1,
        dataCompleteness: 0.1,
        layerConsistency: 0.1,
        resonanceStrength: 0.1,
        wafqClarity: 0.1,
        verificationHistory: 0.1,
      })
    );
    expect(r.level).toBe('منعدمة');
  });

  it('20. custom threshold respected', () => {
    const strict = new ConfidenceEngine(undefined, 0.75);
    const r = strict.evaluate(
      makeDims({
        inputQuality: 0.7,
        dataCompleteness: 0.7,
        layerConsistency: 0.7,
        resonanceStrength: 0.7,
        wafqClarity: 0.7,
        verificationHistory: 0.7,
      })
    );
    expect(r.shouldAbstain).toBe(true);
  });

  it('21. custom weights applied', () => {
    const custom = new ConfidenceEngine({
      inputQuality: 0.5,
      dataCompleteness: 0.5,
      layerConsistency: 0,
      resonanceStrength: 0,
      wafqClarity: 0,
      verificationHistory: 0,
    });
    const score = custom.calculateOverall(
      makeDims({
        inputQuality: 1,
        dataCompleteness: 0,
        layerConsistency: 0,
        resonanceStrength: 0,
        wafqClarity: 0,
        verificationHistory: 0,
      })
    );
    expect(score).toBeCloseTo(0.5);
  });

  it('22. returns dimensions in result', () => {
    const dims = makeDims();
    expect(engine.evaluate(dims).dimensions).toEqual(dims);
  });

  it('23. reasons empty when no abstention', () => {
    expect(engine.evaluate(makeDims()).reasons).toEqual([]);
  });

  it('24. multiple abstention reasons coexist', () => {
    const r = engine.evaluate(
      makeDims({ layerConsistency: 0.1, dataCompleteness: 0.1, inputQuality: 0.05 })
    );
    expect(r.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it('25. overall within [0, 1]', () => {
    const r = engine.evaluate(makeDims());
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(1);
  });
});
