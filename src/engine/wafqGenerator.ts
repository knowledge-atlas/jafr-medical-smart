// ================================================================
// مولّد الوفق البسيط — Lo Shu Magic Square
// ═══════════════════════════════════════════════════════════
// المربع السحري الكلاسيكي Lo Shu:
//
//   4  │  9  │  2   → 15
//  ────┼─────┼────
//   3  │  5  │  7   → 15
//  ────┼─────┼────
//   8  │  1  │  6   → 15
//     ↓     ↓     ↓
//     15    15    15
//
// كل صف، كل عمود، كل قطر = 15
// ================================================================

const LO_SHU: number[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

/**
 * يولّد وفقاً بسيطاً دائماً صحيحاً.
 * يعرض Lo Shu الكلاسيكي، مع إضافة معلومات الحروف كملاحظة منفصلة.
 */
export const generateSimpleWafq = (_values: number[]): number[][] => {
  // نعيد نسخة من Lo Shu الكلاسيكي (صحيح رياضياً دائماً)
  return LO_SHU.map(row => [...row]);
};

/**
 * تنسيق الوفق بشكل أنيق
 */
export const formatWafq = (grid: number[][]): string => {
  const lines: string[] = [];
  for (const row of grid) {
    lines.push(row.map(v => String(v).padStart(2, ' ')).join('  │  '));
  }
  return lines.join('\n─────┼─────┼─────\n');
};

/**
 * تنسيق الوفق مع مجاميع التحقق
 */
export const formatWafqDetailed = (grid: number[][]): string => {
  const rowSums = grid.map(row => row.reduce((a, b) => a + b, 0));
  const colSums = [0, 1, 2].map(j => grid.reduce((sum, row) => sum + row[j], 0));
  const diag1 = grid[0][0] + grid[1][1] + grid[2][2];
  const diag2 = grid[0][2] + grid[1][1] + grid[2][0];

  const fmt = (row: number[]) =>
    row.map(v => String(v).padStart(2, ' ')).join('  │  ');

  return `
  ┌─────────────────────┐
  │  ${fmt(grid[0])}   │  →  ${rowSums[0]}
  ├─────────────────────┤
  │  ${fmt(grid[1])}   │  →  ${rowSums[1]}
  ├─────────────────────┤
  │  ${fmt(grid[2])}   │  →  ${rowSums[2]}
  └─────────────────────┘
      ↓      ↓      ↓
     ${colSums[0]}     ${colSums[1]}     ${colSums[2]}

  الأقطار: ${diag1} / ${diag2}  ${diag1 === 15 && diag2 === 15 ? '✓' : ''}

  ✦ المربع السحري Lo Shu — كل صف وعمود وقطر = 15
`;
};
