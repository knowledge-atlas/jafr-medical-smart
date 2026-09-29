// ================================================================
// مستوردات الأساسيات - الجذور، الكواكب، الأبراج، البيوت، الطبائع، الحروف
// ================================================================

import { KnowledgeEntity } from '../types';
import { ROOTS_FULL_TEXT } from '../../data/fullRoots';
import { PLANETS_FULL_TEXT } from '../../data/planets';
import { SIGNS_FULL_TEXT } from '../../data/signs';
import { HOUSES_FULL_TEXT } from '../../data/houses';
import { ELEMENTS_FULL_TEXT } from '../../data/elements';
import { LETTERS_FULL_TEXT } from '../../data/letters';
import { REMAINDERS_FULL_TEXT } from '../../data/remainders';

// ═══════════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════════

const extractKeywords = (text: string, max: number = 20): string[] => {
  const stopWords = new Set([
    'من', 'في', 'على', 'إلى', 'عن', 'هو', 'هي', 'هذا', 'هذه', 'ذلك',
    'التي', 'الذي', 'الذين', 'كان', 'كانت', 'أن', 'إن', 'ما', 'لا',
    'و', 'أو', 'ثم', 'لكن', 'بل', 'حتى', 'إذا', 'كل', 'بعض', 'غير',
  ]);
  const words = text
    .split(/[\s،,.:;!?()\[\]{}«»"'-]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max)
    .map(([w]) => w);
};

const extractTitle = (text: string, fallback: string): string => {
  const firstLine = text.split('\n')[0].replace(/^#+\s*/, '').trim();
  return firstLine || fallback;
};

// ═══════════════════════════════════════════════════════════════
// 1. الجذور (Roots 1-9)
// ═══════════════════════════════════════════════════════════════

export const importRoots = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (let num = 1; num <= 9; num++) {
    const fullText = ROOTS_FULL_TEXT[num];
    if (!fullText) continue;
    entities.push({
      id: `root_${num}`,
      entityType: 'root',
      entityNumber: num,
      title: extractTitle(fullText, `الجذر ${num}`),
      titleAr: `الجذر ${num}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'fullRoots/root' + num + '.ts',
      keywords: extractKeywords(fullText),
    });
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 2. الكواكب (Planets)
// ═══════════════════════════════════════════════════════════════

export const importPlanets = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  const planetNames = [
    'شمس', 'قمر', 'عطارد', 'زهرة', 'مريخ',
    'مشتري', 'زحل', 'أورانوس', 'نبتون', 'بلوتو',
  ];
  planetNames.forEach((name, idx) => {
    const fullText = PLANETS_FULL_TEXT[name];
    if (!fullText) return;
    entities.push({
      id: `planet_${idx + 1}`,
      entityType: 'planet',
      entityNumber: idx + 1,
      title: name,
      titleAr: name,
      fullText,
      sourceType: 'internal',
      sourceFile: 'planets.ts',
      keywords: extractKeywords(fullText),
    });
  });
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 3. الأبراج (Signs)
// ═══════════════════════════════════════════════════════════════

export const importSigns = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  const signNames = [
    'الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء',
    'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت',
  ];
  signNames.forEach((name, idx) => {
    const fullText = SIGNS_FULL_TEXT[name];
    if (!fullText) return;
    entities.push({
      id: `sign_${idx + 1}`,
      entityType: 'sign',
      entityNumber: idx + 1,
      title: name,
      titleAr: name,
      fullText,
      sourceType: 'internal',
      sourceFile: 'signs.ts',
      keywords: extractKeywords(fullText),
    });
  });
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 4. البيوت (Houses 1-12)
// ═══════════════════════════════════════════════════════════════

export const importHouses = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (let num = 1; num <= 12; num++) {
    const fullText = HOUSES_FULL_TEXT[num];
    if (!fullText) continue;
    entities.push({
      id: `house_${num}`,
      entityType: 'house',
      entityNumber: num,
      title: `البيت ${num}`,
      titleAr: `البيت ${num}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'houses.ts',
      keywords: extractKeywords(fullText),
    });
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 5. الطبائع (Elements)
// ═══════════════════════════════════════════════════════════════

export const importElements = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  const elementNames = ['ناري', 'ترابي', 'هوائي', 'مائي'];
  elementNames.forEach((name, idx) => {
    const fullText = ELEMENTS_FULL_TEXT[name];
    if (!fullText) return;
    entities.push({
      id: `element_${idx + 1}`,
      entityType: 'element',
      entityNumber: idx + 1,
      title: name,
      titleAr: `الطبع ${name}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'elements.ts',
      keywords: extractKeywords(fullText),
    });
  });
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 6. الحروف (Letters 1-28)
// ═══════════════════════════════════════════════════════════════

export const importLetters = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (let num = 1; num <= 28; num++) {
    const fullText = LETTERS_FULL_TEXT[num];
    if (!fullText) continue;
    entities.push({
      id: `letter_${num}`,
      entityType: 'letter',
      entityNumber: num,
      title: `حرف رقم ${num}`,
      titleAr: `حرف رقم ${num}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'letters.ts',
      keywords: extractKeywords(fullText),
    });
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 7. البواقي (Remainders 1-9)
// ═══════════════════════════════════════════════════════════════

export const importRemainders = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (let num = 1; num <= 9; num++) {
    const fullText = REMAINDERS_FULL_TEXT[num];
    if (!fullText) continue;
    entities.push({
      id: `remainder_${num}`,
      entityType: 'remainder',
      entityNumber: num,
      title: `الباقي ${num}`,
      titleAr: `الباقي ${num}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'remainders.ts',
      keywords: extractKeywords(fullText),
    });
  }
  return entities;
};
