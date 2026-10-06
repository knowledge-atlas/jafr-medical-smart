// ================================================================
// محرك البحث الطبي — يستدعيه التبويب المستقل والمحرك التحليلي معاً
// ================================================================

import { MEDICAL_ROOTS, MEDICAL_REMAINDERS } from './medicalRoots';
import * as MedicalTables from './medicalTables';

// قائمة الحقول العربية لكل عنصر
const FIELD_LABELS: Record<string, string> = {
  name: 'الاسم',
  symbol: 'الرمز',
  external: 'الظاهر',
  internal: 'الباطن',
  neurotransmitter: 'الناقل العصبي',
  receptors: 'المستقبلات',
  gland: 'الغدة',
  hormone: 'الهرمون',
  organ: 'العضو',
  system: 'الجهاز',
  psychologicalPattern: 'النمط النفسي',
  attachmentStyle: 'نمط التعلق',
  primaryDrug: 'الدواء الأساسي',
  alternativeDrug: 'الدواء البديل',
  dose: 'الجرعة',
  supplement: 'المكمل',
  psychotherapy: 'العلاج النفسي',
  movementTherapy: 'العلاج الحركي',
  food: 'الغذاء',
  sleep: 'النوم',
  exercise: 'الرياضة',
  symbolicAntidote: 'الترياق الرمزي',
  psychologicalAntidote: 'الترياق النفسي',
  breakdownPoint: 'نقطة الانهيار',
  outcome: 'المآل',
  disorder: 'الخلل',
  symptoms: 'الأعراض',
  antidote: 'الترياق',
};

/**
 * تحويل كائن طبي إلى نص عربي كامل
 */
const medicalToText = (data: any, title: string): string => {
  if (!data) return '';
  const parts: string[] = [`━━━ ${title} ━━━`];
  for (const key of Object.keys(FIELD_LABELS)) {
    const value = data[key];
    if (value) {
      parts.push(`◈ ${FIELD_LABELS[key]}: ${value}`);
    }
  }
  return parts.join('\n');
};

/**
 * النص الطبي الكامل لجذر
 */
export const getMedicalRootFullText = (rootNum: number): string => {
  const data = (MEDICAL_ROOTS as any)[rootNum];
  if (!data) return '';
  const title = `الجذر الطبي ${rootNum}${data.name ? ': ' + data.name : ''}`;
  return medicalToText(data, title);
};

/**
 * النص الطبي الكامل لباقي
 */
export const getMedicalRemainderFullText = (remainderNum: number): string => {
  const data = (MEDICAL_REMAINDERS as any)[remainderNum];
  if (!data) return '';
  const title = `الباقي الطبي ${remainderNum}${data.name ? ': ' + data.name : ''}`;
  return medicalToText(data, title);
};

/**
 * القسم الطبي الكامل للجذر + الباقي
 */
export const buildMedicalSection = (rootNum: number, remainderNum: number): string => {
  const parts: string[] = [];
  const rootText = getMedicalRootFullText(rootNum);
  if (rootText) parts.push(rootText);
  const remainderText = getMedicalRemainderFullText(remainderNum);
  if (remainderText) {
    parts.push('');
    parts.push(remainderText);
  }
  return parts.join('\n\n');
};

/**
 * كل الكائنات الطبية (يستدعيها تبويب MedicalScreen)
 */
export const getAllMedicalRoots = (): any[] => {
  return Object.keys(MEDICAL_ROOTS || {}).map(k => ({
    id: `medical_root_${k}`,
    number: parseInt(k),
    type: 'root',
    data: (MEDICAL_ROOTS as any)[k],
  }));
};

export const getAllMedicalRemainders = (): any[] => {
  return Object.keys(MEDICAL_REMAINDERS || {}).map(k => ({
    id: `medical_remainder_${k}`,
    number: parseInt(k),
    type: 'remainder',
    data: (MEDICAL_REMAINDERS as any)[k],
  }));
};

export const getAllMedicalTables = (): Record<string, any> => MedicalTables as any;

export const getMedicalTable = (tableName: string): any => (MedicalTables as any)[tableName] || null;

export const getMedicalStats = () => ({
  roots: Object.keys(MEDICAL_ROOTS || {}).length,
  remainders: Object.keys(MEDICAL_REMAINDERS || {}).length,
  tables: Object.keys(MedicalTables || {}).length,
});
