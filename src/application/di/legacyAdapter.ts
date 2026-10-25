import { calculateAbjad } from '../../engine/abjad';
import { AnalysisResult } from '../use-cases/AnalyzeNameUseCase';
import { DeepDiveOutput } from '../../products/DeepDiveReport';

export interface LegacyReportShape {
  root: number;
  internalPlanet: string;
  internalSign: string;
  internalElement: string;
  internalHouse: number;
  calculation: { total: number };
  fullReport: string;
  markdown?: string;
  productId?: string;
}

function numOf(id?: string): number | null {
  if (!id) return null;
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function analysisToLegacyReport(
  analysis: AnalysisResult,
  deepDive: DeepDiveOutput
): LegacyReportShape {
  const L = analysis.layers ?? {};
  return {
    root: numOf(L.root) ?? 0,
    internalPlanet: L.planet ?? '',
    internalSign: L.sign ?? '',
    internalElement: L.element ?? '',
    internalHouse: numOf(L.house) ?? 1,
    calculation: { total: calculateAbjad((analysis as any).name ?? '').total },
    fullReport: deepDive.markdown,
    markdown: deepDive.markdown,
    productId: deepDive.meta.productId,
  };
}
