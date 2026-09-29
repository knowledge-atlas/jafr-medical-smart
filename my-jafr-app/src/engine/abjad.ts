export const abjadMap: Record<string, number> = (() => {
  const letters = "ابجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ".replace(/\s/g, '');
  const values = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000];
  const map: Record<string, number> = {};
  for (let i = 0; i < letters.length; i++) {
    map[letters[i]] = values[i];
  }
  map['ة'] = 5;
  map['ى'] = 10;
  return map;
})();

export const extractLetters = (name: string): string[] => {
  return name.split('').filter(c => abjadMap[c] !== undefined);
};

export const calculateAbjad = (name: string) => {
  const letters = extractLetters(name);
  const values = letters.map(l => abjadMap[l]);
  const total = values.reduce((sum, v) => sum + v, 0);
  const digitalRoot = total > 0 ? 1 + (total - 1) % 9 : 0;
  return { letters, values, total, digitalRoot };
};
