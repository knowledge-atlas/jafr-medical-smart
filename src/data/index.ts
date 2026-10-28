// ================================================================
// src/data/index.ts — نقطة الاستيراد الموحدة
// ================================================================

// ── الكيانات الأساسية ──────────────────────────────────────
export { LETTERS_FULL_TEXT } from './letters';
export { PLANETS_FULL_TEXT } from './planets';
export { SIGNS_FULL_TEXT } from './signs';
export { HOUSES_FULL_TEXT } from './houses';
export { ELEMENTS_FULL_TEXT } from './elements';
export { ROOTS_FULL_TEXT } from './roots';

// ── العلاقات والرنين ───────────────────────────────────────
export { RESONANCE_FULL_TEXT } from './resonance';
export { COMPOUNDS_FULL_TEXT } from './compounds';
export { default as elementResonance } from './elementResonance.json';
export { default as jafrResonance } from './jafr_resonance.json';

// ── البواقي ────────────────────────────────────────────────
export { REMAINDERS_FULL_TEXT } from './remainders';


// ── الأوفاق والترياقات ─────────────────────────────────────
export { WAFQ_FULL_TEXT } from './wafq';
export { REMEDIES_TYPES_FULL, IMBALANCE_REMEDIES_FULL } from './remedies';

// ── الجذور الكاملة (استيراد مباشر) ────────────────────────
export { ROOT_1_FULL } from './fullRoots/root1';
export { ROOT_2_FULL } from './fullRoots/root2';
export { ROOT_3_FULL } from './fullRoots/root3';
export { ROOT_4_FULL } from './fullRoots/root4';
export { ROOT_5_FULL } from './fullRoots/root5';
export { ROOT_6_FULL } from './fullRoots/root6';
export { ROOT_7_FULL } from './fullRoots/root7';
export { ROOT_8_FULL } from './fullRoots/root8';
export { ROOT_9_FULL } from './fullRoots/root9';

// ── الموسوعة والنبذات ─────────────────────────────────────
export {
  loadFullEncyclopedia,
  getFullEncyclopedia,
  extractRootEncyclopedia,
} from './encyclopediaLoader';
export { SYSTEM_OVERVIEW, TAB_OVERVIEWS } from './tabOverviews';
