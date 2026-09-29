// ================================================================
// بيانات الجذور الكاملة - الفهرس الرئيسي (كامل 1-9)
// ================================================================

import { ROOT_1_FULL } from './root1';
import { ROOT_2_FULL } from './root2';
import { ROOT_3_FULL } from './root3';
import { ROOT_4_FULL } from './root4';
import { ROOT_5_FULL } from './root5';
import { ROOT_6_FULL } from './root6';
import { ROOT_7_FULL } from './root7';
import { ROOT_8_FULL } from './root8';
import { ROOT_9_FULL } from './root9';

export const ROOTS_FULL_TEXT: Record<number, string> = {
  1: ROOT_1_FULL,
  2: ROOT_2_FULL,
  3: ROOT_3_FULL,
  4: ROOT_4_FULL,
  5: ROOT_5_FULL,
  6: ROOT_6_FULL,
  7: ROOT_7_FULL,
  8: ROOT_8_FULL,
  9: ROOT_9_FULL,
};

export const hasFullRoot = (rootNumber: number): boolean => {
  return ROOTS_FULL_TEXT[rootNumber] !== undefined;
};

export const getFullRootText = (rootNumber: number): string => {
  return ROOTS_FULL_TEXT[rootNumber] || '';
};
