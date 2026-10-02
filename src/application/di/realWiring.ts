import { createAnalyzeNameUseCase } from './container';
import { AnalyzeNameUseCase, NameAnalysisLayers } from '../use-cases/AnalyzeNameUseCase';
import { ConfidenceResult } from '../../domain/services/ConfidenceEngine';
import { arabicNormalizer } from '../../domain/services/ArabicNormalizer';
import { calculateAbjad } from '../../engine/abjad';
import { calculate } from '../../engine/calculator';
import { buildStructuredReport } from '../../engine/structuredReportBuilder';

function realNormalize(name: string): string {
  return arabicNormalizer.normalize(name, { collapseDuplicates: true });
}

function realCalculateAbjad(name: string): number {
  const result = calculateAbjad(name);
  return result.total;
}

function numberLabel(prefix: string, value: any): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return `${prefix}_${value}`;
  return String(value);
}

function realExtractLayers(name: string, _abjad: number): NameAnalysisLayers {
  const calc: any = calculate(name);
  if (!calc || (typeof calc === 'object' && 'error' in calc)) {
    return {};
  }

  const rootValue = calc.root;
  return {
    root: numberLabel('root', rootValue),
    planet: calc.internal?.planet ?? undefined,
    sign: calc.internal?.sign ?? undefined,
    house: numberLabel('house', calc.house ?? calc.internal?.house),
    element: calc.internal?.element ?? undefined,
  };
}

function realBuildFullReport(
  name: string,
  _layers: NameAnalysisLayers,
  confidence: ConfidenceResult
): string {
  const result: any = buildStructuredReport(name);
  if (!result || (typeof result === 'object' && 'error' in result)) {
    return `# خطأ في بناء التقرير\n\n${result?.error ?? 'خطأ غير معروف'}`;
  }
  const markdown: string = result.markdown ?? '';
  const pct = (confidence.overall * 100).toFixed(0);
  const header = `> **درجة الثقة:** ${pct}% — ${confidence.level}\n\n`;
  return header + markdown;
}

export function createRealAnalyzeNameUseCase(): AnalyzeNameUseCase {
  return createAnalyzeNameUseCase({
    normalizeName: realNormalize,
    calculateAbjad: realCalculateAbjad,
    extractLayers: realExtractLayers,
    buildFullReport: realBuildFullReport,
  });
}

export const analyzeName = createRealAnalyzeNameUseCase();
