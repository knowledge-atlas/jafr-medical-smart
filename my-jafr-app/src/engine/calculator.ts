import { abjadMap, calculateAbjad } from './abjad';

type ElementType = 'ناري' | 'ترابي' | 'هوائي' | 'مائي';

const elementLetters: Record<ElementType, string> = {
  'ناري': 'اهطمفشذ',
  'ترابي': 'بويصنتض',
  'هوائي': 'جزكستظق',
  'مائي': 'دحلعرخغ'
};

const rootToPlanet: Record<number, string> = {
  1: 'شمس', 2: 'قمر', 3: 'مشتري', 4: 'زحل', 5: 'عطارد',
  6: 'زهرة', 7: 'نبتون', 8: 'زحل', 9: 'مريخ'
};

const planetToSign: Record<string, string> = {
  'شمس': 'الأسد', 'قمر': 'السرطان', 'مشتري': 'القوس',
  'زحل': 'الجدي', 'عطارد': 'الجوزاء', 'زهرة': 'الميزان',
  'نبتون': 'الحوت', 'مريخ': 'الحمل', 'أورانوس': 'الدلو',
  'بلوتو': 'العقرب'
};

const remainderToHouse: Record<number, number> = {
  0: 12, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5,
  6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11
};

export const houseNames: Record<number, string> = {
  1: 'الذات والهوية', 2: 'المال والقيمة', 3: 'التواصل والتعليم',
  4: 'الجذور والعائلة', 5: 'الإبداع والحب', 6: 'العمل والصحة',
  7: 'الشراكة والعقد', 8: 'التحول والأزمة', 9: 'الرؤية والسفر',
  10: 'المهنة والسلطة', 11: 'الجماعة والمستقبل', 12: 'الباطن والعزلة'
};

export const calculate = (name: string) => {
  const { letters, values, total, digitalRoot } = calculateAbjad(name);
  if (letters.length === 0) {
    return { error: 'لا توجد حروف صالحة للحساب' };
  }

  const counts: Record<ElementType, number> = { 'ناري': 0, 'ترابي': 0, 'هوائي': 0, 'مائي': 0 };
  for (const l of letters) {
    for (const [el, letts] of Object.entries(elementLetters)) {
      if (letts.includes(l)) {
        counts[el as ElementType] += 1;
        break;
      }
    }
  }
  let dominantElement: ElementType = 'ترابي';
  let maxCount = 0;
  for (const [el, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantElement = el as ElementType;
    }
  }
  if (maxCount === 0) dominantElement = 'ترابي';

  const root = digitalRoot !== 0 ? digitalRoot : 1;
  const planet = rootToPlanet[root] || 'شمس';
  const sign = planetToSign[planet] || 'الأسد';
  const houseId = remainderToHouse[total % 12] || 1;
  const houseName = houseNames[houseId];

  const remainders = {
    on9: total % 9 === 0 ? 9 : total % 9,
    on7: total % 7 === 0 ? 7 : total % 7,
    on12: total % 12 === 0 ? 12 : total % 12
  };

  return {
    letters, values, total, digitalRoot,
    root, planet, sign, element: dominantElement,
    houseId, houseName, remainders
  };
};
