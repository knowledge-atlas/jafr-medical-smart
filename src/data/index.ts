// ================================================================
// src/data/index.ts — نقطة الاستيراد الموحدة لطبقة البيانات
// ================================================================

// ── الكيانات الأساسية ─────────────────────────────────────
export { LETTERS_FULL_TEXT } from './letters';
export { PLANETS_FULL_TEXT } from './planets';
export { SIGNS_FULL_TEXT } from './signs';
export { HOUSES_FULL_TEXT } from './houses';
export { ELEMENTS_FULL_TEXT } from './elements';
export { ROOTS_FULL_TEXT } from './roots';

// ── العلاقات والرنين ──────────────────────────────────────
export { RESONANCE_FULL_TEXT } from './resonance';
export { COMPOUNDS_FULL_TEXT } from './compounds';
export { default as elementResonance } from './elementResonance.json';
export { default as jafrResonance } from './jafr_resonance.json';

// ── البواقي ───────────────────────────────────────────────
export { REMAINDERS_FULL_TEXT } from './remainders';

// ── الطب التكاملي ─────────────────────────────────────────
export { MEDICAL_ROOTS, MEDICAL_REMAINDERS } from './medicalRoots';
export type { MedicalRootEntry, MedicalRemainderEntry } from './medicalRoots';
export {
  getMedicalRootFullText,
  getMedicalRemainderFullText,
  buildMedicalSection,
  getAllMedicalRoots,
  getAllMedicalRemainders,
  getAllMedicalTables,
} from './medicalLookup';
export * as MedicalTables from './medicalTables';

// ── الأوفاق والترياقات ────────────────────────────────────
export { WAFQ_FULL_TEXT } from './wafq';
export { REMEDIES_TYPES_FULL, IMBALANCE_REMEDIES_FULL } from './remedies';

// ── الجذور الكاملة (منظّمة) ──────────────────────────────
export {
  ROOT_1_FULL, ROOT_2_FULL, ROOT_3_FULL,
  ROOT_4_FULL, ROOT_5_FULL, ROOT_6_FULL,
  ROOT_7_FULL, ROOT_8_FULL, ROOT_9_FULL,
} from './fullRoots';

// ── الموسوعة والنبذات ────────────────────────────────────
export {
  loadFullEncyclopedia,
  getFullEncyclopedia,
  extractRootEncyclopedia,
} from './encyclopediaLoader';
export { SYSTEM_OVERVIEW, TAB_OVERVIEWS } from './tabOverviews';
