export interface ConfidenceDimensions {
  inputQuality: number;
  dataCompleteness: number;
  layerConsistency: number;
  resonanceStrength: number;
  wafqClarity: number;
  verificationHistory: number;
}

export type ConfidenceLevel = 'عالية' | 'متوسطة' | 'ضعيفة' | 'منعدمة';

export interface ConfidenceResult {
  overall: number;
  level: ConfidenceLevel;
  dimensions: ConfidenceDimensions;
  shouldAbstain: boolean;
  reasons: string[];
}

const DEFAULT_WEIGHTS: ConfidenceDimensions = {
  inputQuality: 0.10,
  dataCompleteness: 0.20,
  layerConsistency: 0.30,
  resonanceStrength: 0.20,
  wafqClarity: 0.10,
  verificationHistory: 0.10,
};

export class ConfidenceEngine {
  private weights: ConfidenceDimensions;
  private threshold: number;

  constructor(weights?: Partial<ConfidenceDimensions>, threshold: number = 0.5) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    this.threshold = threshold;
  }

  evaluate(dimensions: ConfidenceDimensions): ConfidenceResult {
    const overall = this.calculateOverall(dimensions);
    const level = this.classify(overall);
    const { shouldAbstain, reasons } = this.checkAbstention(dimensions, overall);
    return { overall, level, dimensions, shouldAbstain, reasons };
  }

  calculateOverall(d: ConfidenceDimensions): number {
    const w = this.weights;
    return (
      d.inputQuality * w.inputQuality +
      d.dataCompleteness * w.dataCompleteness +
      d.layerConsistency * w.layerConsistency +
      d.resonanceStrength * w.resonanceStrength +
      d.wafqClarity * w.wafqClarity +
      d.verificationHistory * w.verificationHistory
    );
  }

  classify(overall: number): ConfidenceLevel {
    if (overall >= 0.8) return 'عالية';
    if (overall >= 0.65) return 'متوسطة';
    if (overall >= this.threshold) return 'ضعيفة';
    return 'منعدمة';
  }

  checkAbstention(
    d: ConfidenceDimensions,
    overall: number
  ): { shouldAbstain: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (overall < this.threshold) {
      reasons.push(
        `درجة الثقة الإجمالية ${(overall * 100).toFixed(0)}% أقل من الحد الأدنى ${(this.threshold * 100).toFixed(0)}%`
      );
    }
    if (d.layerConsistency < 0.3) {
      reasons.push(`اتساق الطبقات ${(d.layerConsistency * 100).toFixed(0)}% منخفض جداً`);
    }
    if (d.dataCompleteness < 0.2) {
      reasons.push(`اكتمال البيانات ${(d.dataCompleteness * 100).toFixed(0)}% غير كافٍ`);
    }
    if (d.inputQuality < 0.1) {
      reasons.push(`جودة المدخل ${(d.inputQuality * 100).toFixed(0)}% ضعيفة`);
    }
    return { shouldAbstain: reasons.length > 0, reasons };
  }
}
