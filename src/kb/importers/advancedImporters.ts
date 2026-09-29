// ================================================================
// مستوردات المتقدمات - الرنين، التراكيب، الأوفاق، الترياقات
// ================================================================

import { KnowledgeEntity } from '../types';
import { COMPOUNDS_FULL_TEXT } from '../../data/compounds';
import { RESONANCE_FULL_TEXT } from '../../data/resonance';
import { WAFQ_FULL_TEXT } from '../../data/wafq';
import {
  REMEDIES_TYPES_FULL,
  IMBALANCE_REMEDIES_FULL,
} from '../../data/remedies';

const extractKeywords = (text: string, max: number = 20): string[] => {
  const stopWords = new Set([
    'من', 'في', 'على', 'إلى', 'عن', 'هو', 'هي', 'هذا', 'هذه', 'ذلك',
    'التي', 'الذي', 'كان', 'أن', 'إن', 'ما', 'لا', 'و', 'أو', 'ثم', 'كل',
  ]);
  const words = text
    .split(/[\s،,.:;!?()\[\]{}«»"'-]+/)
    .filter(w => w.length >= 3 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max)
    .map(([w]) => w);
};

// ═══════════════════════════════════════════════════════════════
// 1. الرنين (45 علاقة)
// ═══════════════════════════════════════════════════════════════

export const importResonance = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  let idx = 1;
  for (const key of Object.keys(RESONANCE_FULL_TEXT)) {
    const fullText = RESONANCE_FULL_TEXT[key];
    entities.push({
      id: `resonance_${key}`,
      entityType: 'resonance',
      entityNumber: idx,
      title: `رنين ${key.replace('_', '+')}`,
      titleAr: `رنين الجذرين ${key.replace('_', ' + ')}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'resonance.ts',
      keywords: extractKeywords(fullText),
      metadata: { key, parts: key.split('_') },
    });
    idx++;
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 2. التراكيب (33 تركيباً)
// ═══════════════════════════════════════════════════════════════

export const importCompounds = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  let idx = 1;
  for (const key of Object.keys(COMPOUNDS_FULL_TEXT)) {
    const fullText = COMPOUNDS_FULL_TEXT[key];
    entities.push({
      id: `compound_${key}`,
      entityType: 'compound',
      entityNumber: idx,
      title: `تركيب ${key.replace('_', ' + ')}`,
      titleAr: `التركيب ${key.replace('_', ' + ')}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'compounds.ts',
      keywords: extractKeywords(fullText),
      metadata: { key, parts: key.split('_') },
    });
    idx++;
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 3. الأوفاق (8 أنواع)
// ═══════════════════════════════════════════════════════════════

export const importWafq = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (let num = 1; num <= 8; num++) {
    const fullText = WAFQ_FULL_TEXT[num];
    if (!fullText) continue;
    entities.push({
      id: `wafq_${num}`,
      entityType: 'wafq',
      entityNumber: num,
      title: `الوفق ${num}`,
      titleAr: `الوفق ${num}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'wafq.ts',
      keywords: extractKeywords(fullText),
    });
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 4. الترياقات (أنواع وخلل)
// ═══════════════════════════════════════════════════════════════

export const importRemedies = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  let idx = 1;

  // الترياقات العامة
  for (const name of Object.keys(REMEDIES_TYPES_FULL)) {
    const fullText = REMEDIES_TYPES_FULL[name];
    entities.push({
      id: `remedy_${idx}`,
      entityType: 'remedy',
      entityNumber: idx,
      title: name,
      titleAr: name,
      fullText,
      sourceType: 'internal',
      sourceFile: 'remedies.ts',
      keywords: extractKeywords(fullText),
      metadata: { category: 'type' },
    });
    idx++;
  }

  // علاجات الخلل
  for (const name of Object.keys(IMBALANCE_REMEDIES_FULL)) {
    const fullText = IMBALANCE_REMEDIES_FULL[name];
    entities.push({
      id: `remedy_imbalance_${idx}`,
      entityType: 'remedy',
      entityNumber: idx,
      title: name,
      titleAr: name,
      fullText,
      sourceType: 'internal',
      sourceFile: 'remedies.ts',
      keywords: extractKeywords(fullText),
      metadata: { category: 'imbalance' },
    });
    idx++;
  }

  return entities;
};
