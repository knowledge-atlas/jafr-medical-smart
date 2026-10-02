import { ConfidenceDimensions } from '../../domain/services/ConfidenceEngine';
import { NameAnalysisLayers } from '../use-cases/AnalyzeNameUseCase';

const ARABIC_LETTERS = /[\u0621-\u064A]/g;

function countArabicLetters(text: string): number {
  const m = text.match(ARABIC_LETTERS);
  return m ? m.length : 0;
}

function scoreInputQuality(normalized: string): number {
  const len = countArabicLetters(normalized);
  if (len === 0) return 0;
  if (len === 1) return 0.4;
  if (len === 2) return 0.7;
  return 1.0;
}

function scoreDataCompleteness(layers: NameAnalysisLayers): number {
  const keys: Array<keyof NameAnalysisLayers> = [
    'root',
    'planet',
    'sign',
    'house',
    'element',
  ];
  const present = keys.filter((k) => layers[k] !== undefined && layers[k] !== '').length;
  return present / keys.length;
}

function scoreLayerConsistency(layers: NameAnalysisLayers): number {
  const main: Array<keyof NameAnalysisLayers> = ['root', 'planet', 'sign'];
  const present = main.filter((k) => layers[k] !== undefined && layers[k] !== '');
  return present.length / main.length;
}

export function computeConfidenceFromLayers(
  normalized: string,
  layers: NameAnalysisLayers
): ConfidenceDimensions {
  return {
    inputQuality: scoreInputQuality(normalized),
    dataCompleteness: scoreDataCompleteness(layers),
    layerConsistency: scoreLayerConsistency(layers),
    resonanceStrength: 0.7,
    wafqClarity: 0.7,
    verificationHistory: 0.5,
  };
}
