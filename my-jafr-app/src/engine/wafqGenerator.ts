export const generateSimpleWafq = (values: number[]): number[][] => {
  const grid: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const sorted = [...values].sort((a, b) => a - b);
  let idx = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      grid[i][j] = sorted[idx % sorted.length] || 0;
      idx++;
    }
  }
  return grid;
};

export const formatWafq = (grid: number[][]): string => {
  return grid.map(row => row.join(' | ')).join('\n');
};
