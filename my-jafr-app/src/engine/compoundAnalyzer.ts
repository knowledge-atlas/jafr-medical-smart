import { COMPOUNDS_FULL_TEXT } from '../data/compounds';

export const analyzeCompounds = (letters: string[]): string[] => {
  const results: string[] = [];
  if (letters.length < 2) return ['لا توجد تراكيب كافية'];
  for (let i = 0; i < letters.length - 1; i++) {
    const key = `${letters[i]}_${letters[i+1]}`;
    const text = COMPOUNDS_FULL_TEXT[key];
    if (text) {
      results.push(`🔹 تركيب (${letters[i]} + ${letters[i+1]}): ${text.substring(0, 100)}...`);
    }
  }
  return results.length ? results : ['لا توجد تراكيب مطابقة في الموسوعة'];
};
