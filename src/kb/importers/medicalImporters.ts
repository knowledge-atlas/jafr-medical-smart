// ================================================================
// مستوردات الطب التكاملي
// ================================================================

import { KnowledgeEntity } from '../types';
import { MEDICAL_ROOTS, MEDICAL_REMAINDERS } from '../../data/medicalRoots';

const extractKeywords = (text: string, max: number = 20): string[] => {
  const stopWords = new Set([
    'من', 'في', 'على', 'إلى', 'عن', 'هو', 'هي', 'هذا', 'هذه',
    'التي', 'الذي', 'كان', 'أن', 'إن', 'ما', 'لا', 'و', 'أو',
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

/**
 * تحويل كائن طبي إلى نص كامل
 */
const medicalRootToText = (data: any): string => {
  return [
    `الاسم: ${data.name}`,
    `الرمز: ${data.symbol}`,
    `الظاهر: ${data.external}`,
    `الباطن: ${data.internal}`,
    `الناقل العصبي: ${data.neurotransmitter}`,
    `المستقبلات: ${data.receptors}`,
    `الغدة: ${data.gland}`,
    `الهرمون: ${data.hormone}`,
    `العضو: ${data.organ}`,
    `الجهاز: ${data.system}`,
    `النمط النفسي: ${data.psychologicalPattern}`,
    `نمط التعلق: ${data.attachmentStyle}`,
    `الدواء الأساسي: ${data.primaryDrug}`,
    `الدواء البديل: ${data.alternativeDrug}`,
    `الجرعة: ${data.dose}`,
    `المكمل: ${data.supplement}`,
    `العلاج النفسي: ${data.psychotherapy}`,
    `العلاج الحركي: ${data.movementTherapy}`,
    `الغذاء: ${data.food}`,
    `النوم: ${data.sleep}`,
    `الرياضة: ${data.exercise}`,
    `الترياق الرمزي: ${data.symbolicAntidote}`,
    `الترياق النفسي: ${data.psychologicalAntidote}`,
    `نقطة الانهيار: ${data.breakdownPoint}`,
    `المآل: ${data.outcome}`,
  ].join('\n');
};

const medicalRemainderToText = (data: any): string => {
  return [
    `الاسم: ${data.name}`,
    `الرمز: ${data.symbol}`,
    `الظاهر: ${data.external}`,
    `الباطن: ${data.internal}`,
    `الخلل: ${data.disorder}`,
    `الأعراض: ${data.symptoms}`,
    `الناقل العصبي: ${data.neurotransmitter}`,
    `الغدة: ${data.gland}`,
    `العضو: ${data.organ}`,
    `الدواء الأساسي: ${data.primaryDrug}`,
    `الدواء البديل: ${data.alternativeDrug}`,
    `الجرعة: ${data.dose}`,
    `المكمل: ${data.supplement}`,
    `العلاج النفسي: ${data.psychotherapy}`,
    `العلاج الحركي: ${data.movementTherapy}`,
    `الترياق: ${data.antidote}`,
    `الترياق الرمزي: ${data.symbolicAntidote}`,
    `الترياق النفسي: ${data.psychologicalAntidote}`,
    `المآل: ${data.outcome}`,
  ].join('\n');
};

// ═══════════════════════════════════════════════════════════════
// 1. الجذور الطبية
// ═══════════════════════════════════════════════════════════════

export const importMedicalRoots = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (const key of Object.keys(MEDICAL_ROOTS)) {
    const num = parseInt(key, 10);
    const data = MEDICAL_ROOTS[num];
    if (!data) continue;
    const fullText = medicalRootToText(data);
    entities.push({
      id: `medical_root_${num}`,
      entityType: 'medical_root',
      entityNumber: num,
      title: data.name,
      titleAr: `الجذر الطبي ${num} — ${data.name}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'medicalRoots.ts',
      keywords: extractKeywords(fullText, 30),
      metadata: { raw: data },
    });
  }
  return entities;
};

// ═══════════════════════════════════════════════════════════════
// 2. البواقي الطبية
// ═══════════════════════════════════════════════════════════════

export const importMedicalRemainders = (): KnowledgeEntity[] => {
  const entities: KnowledgeEntity[] = [];
  for (const key of Object.keys(MEDICAL_REMAINDERS)) {
    const num = parseInt(key, 10);
    const data = MEDICAL_REMAINDERS[num];
    if (!data) continue;
    const fullText = medicalRemainderToText(data);
    entities.push({
      id: `medical_remainder_${num}`,
      entityType: 'medical_remainder',
      entityNumber: num,
      title: data.name,
      titleAr: `الباقي الطبي ${num} — ${data.name}`,
      fullText,
      sourceType: 'internal',
      sourceFile: 'medicalRoots.ts',
      keywords: extractKeywords(fullText, 30),
      metadata: { raw: data },
    });
  }
  return entities;
};
