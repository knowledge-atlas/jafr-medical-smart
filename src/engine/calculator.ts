import { abjadMap, calculateAbjad } from './abjad';
import { getRootData } from '../data/encyclopedia';

type ElementType = 'ناري' | 'ترابي' | 'هوائي' | 'مائي';

// ================================================================
// خرائط أساسية
// ================================================================

const elementLetters: Record<ElementType, string> = {
  'ناري': 'اهطمفشذ',
  'ترابي': 'بويصنتض',
  'هوائي': 'جزكستظق',
  'مائي': 'دحلعرخغ',
};

// الجذر ← الكوكب (خريطة تقليدية)
const rootToPlanet: Record<number, string> = {
  1: 'شمس', 2: 'قمر', 3: 'مشتري', 4: 'زحل', 5: 'عطارد',
  6: 'زهرة', 7: 'نبتون', 8: 'زحل', 9: 'مريخ',
};

// الكوكب ← البرج
const planetToSign: Record<string, string> = {
  'شمس': 'الأسد', 'قمر': 'السرطان', 'مشتري': 'القوس',
  'زحل': 'الجدي', 'عطارد': 'الجوزاء', 'زهرة': 'الميزان',
  'نبتون': 'الحوت', 'مريخ': 'الحمل', 'أورانوس': 'الدلو',
  'بلوتو': 'العقرب',
};

// البيت ← البرج المقابل
export const houseToSign: Record<number, string> = {
  1: 'الحمل',      // البيت 1 = الحمل
  2: 'الثور',      // البيت 2 = الثور
  3: 'الجوزاء',    // البيت 3 = الجوزاء
  4: 'السرطان',    // البيت 4 = السرطان
  5: 'الأسد',      // البيت 5 = الأسد
  6: 'العذراء',    // البيت 6 = العذراء
  7: 'الميزان',    // البيت 7 = الميزان
  8: 'العقرب',     // البيت 8 = العقرب
  9: 'القوس',      // البيت 9 = القوس
  10: 'الجدي',     // البيت 10 = الجدي
  11: 'الدلو',     // البيت 11 = الدلو
  12: 'الحوت',     // البيت 12 = الحوت
};

// ═══════════════════════════════════════════════════════════
// خريطة عكسية: البرج → بيته الطبيعي (تطابق فلكي ثابت)
// ═══════════════════════════════════════════════════════════
const signToHouse: Record<string, number> = {
  'الحمل': 1, 'الثور': 2, 'الجوزاء': 3, 'السرطان': 4,
  'الأسد': 5, 'العذراء': 6, 'الميزان': 7, 'العقرب': 8,
  'القوس': 9, 'الجدي': 10, 'الدلو': 11, 'الحوت': 12,
  'حمل': 1, 'ثور': 2, 'جوزاء': 3, 'سرطان': 4,
  'أسد': 5, 'عذراء': 6, 'ميزان': 7, 'عقرب': 8,
  'قوس': 9, 'جدي': 10, 'دلو': 11, 'حوت': 12,
};


// البيت ← الكوكب الحاكم التقليدي (النظام السباعي)
export const houseToRulingPlanet: Record<number, string> = {
  1: 'مريخ',      // الحمل
  2: 'زهرة',      // الثور
  3: 'عطارد',     // الجوزاء
  4: 'قمر',       // السرطان
  5: 'شمس',       // الأسد
  6: 'عطارد',     // العذراء
  7: 'زهرة',      // الميزان
  8: 'مريخ',      // العقرب ← التصحيح (كان بلوتو)
  9: 'مشتري',     // القوس
  10: 'زحل',      // الجدي
  11: 'زحل',      // الدلو ← التصحيح
  12: 'مشتري',    // الحوت ← التصحيح
};

// البرج ← الطبع
export const signToElement: Record<string, ElementType> = {
  'الحمل': 'ناري', 'الأسد': 'ناري', 'القوس': 'ناري',
  'الثور': 'ترابي', 'العذراء': 'ترابي', 'الجدي': 'ترابي',
  'الجوزاء': 'هوائي', 'الميزان': 'هوائي', 'الدلو': 'هوائي',
  'السرطان': 'مائي', 'العقرب': 'مائي', 'الحوت': 'مائي',
};

// أسماء البيوت
export const houseNames: Record<number, string> = {
  1: 'الذات والهوية', 2: 'المال والقيمة', 3: 'التواصل والتعليم',
  4: 'الجذور والعائلة', 5: 'الإبداع والحب', 6: 'العمل والصحة',
  7: 'الشراكة والعقد', 8: 'التحول والأزمة', 9: 'الرؤية والسفر',
  10: 'المهنة والسلطة', 11: 'الجماعة والمستقبل', 12: 'الباطن والعزلة',
};

// ================================================================
// دوال تطبيع المفاتيح
// ================================================================

export const normalizePlanetKey = (name: string): string => {
  return name.startsWith('ال') ? name.slice(2) : name;
};

export const normalizeElementKey = (name: string): string => {
  const map: Record<string, string> = {
    'ماء': 'مائي', 'نار': 'ناري', 'تراب': 'ترابي', 'هواء': 'هوائي',
  };
  return map[name] || name;
};

// ================================================================
// دوال حسابية مساعدة
// ================================================================

/**
 * حساب الطبع المكتسب من حروف الاسم
 * (مع قاعدة كسر التعادل: الحرف الأول يفوز)
 */
const computeAcquiredElement = (letters: string[]): ElementType => {
  const counts: Record<ElementType, number> = { 'ناري': 0, 'ترابي': 0, 'هوائي': 0, 'مائي': 0 };
  for (const l of letters) {
    for (const [el, letts] of Object.entries(elementLetters)) {
      if (letts.includes(l)) {
        counts[el as ElementType] += 1;
        break;
      }
    }
  }

  let maxCount = 0;
  const tied: ElementType[] = [];
  for (const [el, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      tied.length = 0;
      tied.push(el as ElementType);
    } else if (count === maxCount && count > 0) {
      tied.push(el as ElementType);
    }
  }

  // كسر التعادل: الحرف الأول يفوز
  if (tied.length > 1 && letters.length > 0) {
    const firstLetter = letters[0];
    for (const [el, letts] of Object.entries(elementLetters)) {
      if (letts.includes(firstLetter)) {
        return el as ElementType;
      }
    }
  }

  return tied[0] || 'ترابي';
};

/**
 * حساب الطبع من مجموع الاسم (mod 4)
 */
const computeSumElement = (total: number): ElementType => {
  const map: Record<number, ElementType> = {
    1: 'ناري', 2: 'هوائي', 3: 'مائي', 0: 'ترابي',
  };
  return map[total % 4] || 'ترابي';
};

// ================================================================
// الدالة الرئيسية
// ================================================================


// ═══════════════════════════════════════════════════════════
// الطبع الأساسي لكل جذر — مستخرج من نصوص الجذور الرسمية
// ═══════════════════════════════════════════════════════════
const ROOT_ELEMENT: Record<number, ElementType> = {
  1: 'ناري',    // Root 1 - السيادي (اندفاع، بداية)
  2: 'مائي',    // Root 2 - الدبلوماسي (احتواء، عمق)
  3: 'هوائي',   // Root 3 - التعبير (تواصل، فكر)
  4: 'ترابي',   // Root 4 - القاعدة (بناء، ثبات)
  5: 'ناري',    // Root 5 - الحرية (تجربة، إبداع)
  6: 'مائي',    // Root 6 - الرعاية (احتواء، وفاء)
  7: 'مائي',    // Root 7 - البحث (عمق، حدس)
  8: 'ترابي',   // Root 8 - التمكين (سلطة، بناء)
  9: 'ناري',    // Root 9 - الاكتمال (حسم، ختم)
};

export const calculate = (name: string) => {
  const { letters, values, total, digitalRoot } = calculateAbjad(name);
  if (letters.length === 0) {
    return { error: 'لا توجد حروف صالحة للحساب' };
  }

  // =====================================================
  // 1. الجذر
  // =====================================================
  const root = total % 9 === 0 ? 9 : total % 9;

  // =====================================================
  // 2. البواقي
  // =====================================================
  const remainders = {
    on9: root,
    on7: total % 7 === 0 ? 7 : total % 7,
    on12: total % 12 === 0 ? 12 : total % 12,
    on28: total % 28 === 0 ? 28 : total % 28,
  };

  // =====================================================
  // 3. الطبقة الداخلية (من الجذر / JSON)
  // =====================================================
  let internalElement: ElementType = ROOT_ELEMENT[root] || computeSumElement(total);
  let internalPlanet = rootToPlanet[root] || 'شمس';
  let internalSign = planetToSign[internalPlanet] || 'الأسد';
  let internalHouse = 1;
  let internalHouseName = '';

  try {
    const rootData = getRootData(root);
    if (rootData?.operational) {
      // الأولوية: خريطة الجذر الثابتة (أكثر دقة)
      // ثم operational.element إذا موجود
      internalElement = ROOT_ELEMENT[root] || normalizeElementKey(rootData.operational.element || '') as ElementType || internalElement;
      internalPlanet = rootData.operational.planet || internalPlanet;
      internalSign = rootData.operational.sign || internalSign;
      // البيت الداخلي يُشتق من البرج الداخلي (تطابق فلكي طبيعي)
      internalHouse = signToHouse[internalSign] || remainders.on12;
      internalHouseName = houseNames[internalHouse] || '';
    } else {
      internalHouse = signToHouse[internalSign] || remainders.on12;
      internalHouseName = houseNames[internalHouse] || '';
    }
  } catch (e) {
    internalHouse = signToHouse[internalSign] || remainders.on12;
    internalHouseName = houseNames[internalHouse] || '';
  }

  // =====================================================
  // 4. الطبقة الخارجية (الباقي على 12)
  // =====================================================
  const externalHouseNumber = remainders.on12;
  const externalSign = houseToSign[externalHouseNumber] || '';
  const externalPlanet = houseToRulingPlanet[externalHouseNumber] || '';
  const externalElement = signToElement[externalSign] || 'ترابي';
  const externalHouseName = houseNames[externalHouseNumber] || '';

  // =====================================================
  // 5. الطبع المكتسب (من حروف الاسم)
  // =====================================================
  const acquiredElement = computeAcquiredElement(letters);

  return {
    letters,
    values,
    total,
    digitalRoot,
    root,

    // الطبقة الداخلية (الجذر)
    internal: {
      element: internalElement,
      planet: internalPlanet,
      sign: internalSign,
      house: internalHouse,
      houseName: internalHouseName,
    },

    // الطبقة الخارجية (الباقي على 12)
    external: {
      houseNumber: externalHouseNumber,
      houseName: externalHouseName,
      sign: externalSign,
      planet: externalPlanet,
      element: externalElement,
    },

    // الطبع المكتسب من الحروف
    acquiredElement,

    remainders,
  };
};
