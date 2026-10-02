import {
  ConfidenceEngine,
  ConfidenceDimensions,
  ConfidenceResult,
} from '../../domain/services/ConfidenceEngine';
import { AbstentionProtocol, AbstentionResult } from '../../domain/services/AbstentionProtocol';

export interface NameAnalysisLayers {
  root?: string;
  planet?: string;
  sign?: string;
  house?: string;
  element?: string;
}

export interface AnalyzeNameInput {
  name: string;
  symptoms?: string[];
  feedbackHistory?: Array<{ pattern: string; wasAccurate: boolean }>;
}

export interface AnalysisResult {
  status: 'full' | 'abstained';
  name: string;
  confidence: ConfidenceResult;
  abstention: AbstentionResult;
  layers?: NameAnalysisLayers;
  report: string;
}

export interface AnalysisDependencies {
  normalizeName: (name: string) => string;
  calculateAbjad: (name: string) => number;
  extractLayers: (name: string, abjad: number) => NameAnalysisLayers;
  computeConfidence: (name: string, layers: NameAnalysisLayers) => ConfidenceDimensions;
  buildFullReport: (
    name: string,
    layers: NameAnalysisLayers,
    confidence: ConfidenceResult
  ) => string;
  buildAbstentionReport: (abstention: AbstentionResult) => string;
}

export class AnalyzeNameUseCase {
  private confidence: ConfidenceEngine;
  private abstention: AbstentionProtocol;

  constructor(
    private deps: AnalysisDependencies,
    confidence?: ConfidenceEngine,
    abstention?: AbstentionProtocol
  ) {
    this.confidence = confidence ?? new ConfidenceEngine();
    this.abstention = abstention ?? new AbstentionProtocol();
  }

  execute(input: AnalyzeNameInput): AnalysisResult {
    const original = input.name;
    const normalized = this.deps.normalizeName(original);
    const abjad = this.deps.calculateAbjad(normalized);
    const layers = this.deps.extractLayers(normalized, abjad);
    const dims = this.deps.computeConfidence(normalized, layers);
    const confResult = this.confidence.evaluate(dims);

    const abstention = this.abstention.check({
      name: original,
      confidence: confResult.overall,
      layerConsistency: dims.layerConsistency,
      feedbackHistory: input.feedbackHistory,
      currentPattern: this.patternKey(layers),
    });

    if (abstention.shouldAbstain) {
      return {
        status: 'abstained',
        name: original,
        confidence: confResult,
        abstention,
        report: this.deps.buildAbstentionReport(abstention),
      };
    }

    return {
      status: 'full',
      name: original,
      confidence: confResult,
      abstention,
      layers,
      report: this.deps.buildFullReport(original, layers, confResult),
    };
  }

  private patternKey(layers: NameAnalysisLayers): string {
    return `${layers.root ?? ''}:${layers.planet ?? ''}:${layers.sign ?? ''}`;
  }
}
