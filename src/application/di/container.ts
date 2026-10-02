import {
  AnalyzeNameUseCase,
  AnalysisDependencies,
  NameAnalysisLayers,
} from '../use-cases/AnalyzeNameUseCase';
import { ConfidenceEngine, ConfidenceResult } from '../../domain/services/ConfidenceEngine';
import { AbstentionProtocol } from '../../domain/services/AbstentionProtocol';
import { computeConfidenceFromLayers } from './confidenceFromLayers';
import { buildAbstentionReport } from './abstentionReport';

const ABJAD_TABLE: Record<string, number> = {
  ا: 1, ب: 2, ج: 3, د: 4, ه: 5, و: 6, ز: 7, ح: 8, ط: 9,
  ي: 10, ك: 20, ل: 30, م: 40, ن: 50, س: 60, ع: 70, ف: 80,
  ص: 90, ق: 100, ر: 200, ش: 300, ت: 400, ث: 500, خ: 600,
  ذ: 700, ض: 800, ظ: 900, غ: 1000,
};

function defaultNormalize(name: string): string {
  return name
    .trim()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/\s+/g, ' ');
}

function defaultCalculateAbjad(name: string): number {
  let sum = 0;
  for (const ch of name) {
    if (ABJAD_TABLE[ch] !== undefined) sum += ABJAD_TABLE[ch];
  }
  return sum;
}

function defaultExtractLayers(name: string, abjad: number): NameAnalysisLayers {
  const rootIdx = (abjad % 9) + 1;
  const planetIdx = (abjad % 10) + 1;
  const signIdx = (abjad % 12) + 1;
  const houseIdx = (abjad % 12) + 1;
  const elements = ['ناري', 'ترابي', 'هوائي', 'مائي'];
  const element = elements[abjad % 4];
  return {
    root: `root_${rootIdx}`,
    planet: `planet_${planetIdx}`,
    sign: `sign_${signIdx}`,
    house: `house_${houseIdx}`,
    element,
  };
}

function defaultBuildFullReport(
  name: string,
  layers: NameAnalysisLayers,
  confidence: ConfidenceResult
): string {
  const lines: string[] = [];
  lines.push(`# تقرير تحليل: ${name}`);
  lines.push('');
  lines.push(`**درجة الثقة:** ${(confidence.overall * 100).toFixed(0)}% — ${confidence.level}`);
  lines.push('');
  lines.push('## الطبقات');
  lines.push('');
  lines.push(`- الجذر: ${layers.root ?? '—'}`);
  lines.push(`- الكوكب: ${layers.planet ?? '—'}`);
  lines.push(`- البرج: ${layers.sign ?? '—'}`);
  lines.push(`- البيت: ${layers.house ?? '—'}`);
  lines.push(`- الطبع: ${layers.element ?? '—'}`);
  lines.push('');
  lines.push('## ملاحظة');
  lines.push('');
  lines.push('هذا تحليل نمطي وليس حكماً قاطعاً.');
  return lines.join('\n');
}

export interface ContainerOverrides {
  normalizeName?: AnalysisDependencies['normalizeName'];
  calculateAbjad?: AnalysisDependencies['calculateAbjad'];
  extractLayers?: AnalysisDependencies['extractLayers'];
  computeConfidence?: AnalysisDependencies['computeConfidence'];
  buildFullReport?: AnalysisDependencies['buildFullReport'];
  buildAbstentionReport?: AnalysisDependencies['buildAbstentionReport'];
}

export function createAnalyzeNameUseCase(
  overrides: ContainerOverrides = {}
): AnalyzeNameUseCase {
  const deps: AnalysisDependencies = {
    normalizeName: overrides.normalizeName ?? defaultNormalize,
    calculateAbjad: overrides.calculateAbjad ?? defaultCalculateAbjad,
    extractLayers: overrides.extractLayers ?? defaultExtractLayers,
    computeConfidence: overrides.computeConfidence ?? computeConfidenceFromLayers,
    buildFullReport: overrides.buildFullReport ?? defaultBuildFullReport,
    buildAbstentionReport: overrides.buildAbstentionReport ?? buildAbstentionReport,
  };
  return new AnalyzeNameUseCase(deps, new ConfidenceEngine(), new AbstentionProtocol());
}
