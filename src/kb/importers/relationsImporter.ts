// ================================================================
// مستورد العلاقات — يربط الكيانات ببعضها لبناء الرسم البياني
// ================================================================

import { KnowledgeRelation } from '../types';

let relCounter = 1;
const mkRel = (from: string, to: string, type: string, weight = 1.0, meta?: any): KnowledgeRelation => ({
  id: `rel_${relCounter++}`,
  sourceEntityId: from,
  targetEntityId: to,
  relationType: type,
  weight,
  metadata: meta,
});

// ═══════════════════════════════════════════════════════════════
// 1. علاقات الجذور → الكواكب (GOVERNED_BY)
// ═══════════════════════════════════════════════════════════════
const ROOT_PLANET_MAP: Record<number, number> = {
  1: 1,  // الشمس
  2: 2,  // القمر
  3: 6,  // المشتري
  4: 7,  // زحل
  5: 3,  // عطارد
  6: 4,  // الزهرة
  7: 9,  // نبتون
  8: 7,  // زحل
  9: 5,  // المريخ
};

// ═══════════════════════════════════════════════════════════════
// 2. علاقات الكواكب → الأبراج (EXPRESSED_AS)
// ═══════════════════════════════════════════════════════════════
const PLANET_SIGN_MAP: Record<number, number[]> = {
  1: [5],       // الشمس → الأسد
  2: [4],       // القمر → السرطان
  3: [3, 6],    // عطارد → الجوزاء، العذراء
  4: [2, 7],    // الزهرة → الثور، الميزان
  5: [1, 8],    // المريخ → الحمل، العقرب
  6: [9, 12],   // المشتري → القوس، الحوت
  7: [10, 11],  // زحل → الجدي، الدلو
  8: [],        // أورانوس (لا كوكب تقليدي)
  9: [12],      // نبتون → الحوت
  10: [8],      // بلوتو → العقرب
};

// ═══════════════════════════════════════════════════════════════
// 3. علاقات الأبراج → البيوت (OPERATES_IN)
// ═══════════════════════════════════════════════════════════════
const SIGN_HOUSE_MAP: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12,
};

// ═══════════════════════════════════════════════════════════════
// 4. علاقات الجذور بالطبائع (HAS_ELEMENT)
// ═══════════════════════════════════════════════════════════════
const ROOT_ELEMENT_MAP: Record<number, number> = {
  1: 1, // نار
  2: 4, // ماء
  3: 3, // هواء
  4: 2, // تراب
  5: 3, // هواء
  6: 3, // هواء
  7: 4, // ماء
  8: 2, // تراب
  9: 1, // نار
};

// ═══════════════════════════════════════════════════════════════
// 5. رنين الجذور (RESONATES_WITH)
// ═══════════════════════════════════════════════════════════════
const ROOT_RESONANCE: Record<number, { compatible: number[]; conflicts: number[] }> = {
  1: { compatible: [3, 4, 6], conflicts: [2, 7, 9] },
  2: { compatible: [4, 6, 9], conflicts: [1, 5, 8] },
  3: { compatible: [1, 5, 7], conflicts: [4, 8, 9] },
  4: { compatible: [1, 2, 8], conflicts: [3, 5, 7] },
  5: { compatible: [3, 7, 8], conflicts: [2, 4, 9] },
  6: { compatible: [1, 2, 9], conflicts: [4, 5, 8] },
  7: { compatible: [3, 5, 9], conflicts: [1, 4, 8] },
  8: { compatible: [1, 4, 6], conflicts: [2, 5, 7] },
  9: { compatible: [2, 6, 7], conflicts: [1, 3, 8] },
};

// ═══════════════════════════════════════════════════════════════
// 6. علاقات العلاج (REMEDIED_BY)
// ═══════════════════════════════════════════════════════════════
const ROOT_REMEDY_HINT: Record<number, string> = {
  1: 'الشراكة المنضبطة والاستماع',
  2: 'تحديد الحدود والاستقلال العاطفي',
  3: 'التثبيت والجدولة',
  4: 'مرونة محسوبة وتجديد تدريجي',
  5: 'تثبيت جزئي والتزام واحد',
  6: 'حدود واضحة وتوزيع الأدوار',
  7: 'ربط التحليل بالفعل والخروج من العزلة',
  8: 'إنسانية القرار والرحمة',
  9: 'إنهاء الدورات والاعتناء بالذات',
};

// ═══════════════════════════════════════════════════════════════
// المُصدِّر الرئيسي
// ═══════════════════════════════════════════════════════════════

export const importRelations = (): KnowledgeRelation[] => {
  const relations: KnowledgeRelation[] = [];

  // 1. جذر → كوكب
  for (const [rootNum, planetNum] of Object.entries(ROOT_PLANET_MAP)) {
    relations.push(mkRel(`root_${rootNum}`, `planet_${planetNum}`, 'GOVERNED_BY', 1.0));
  }

  // 2. كوكب → برج
  for (const [planetNum, signNums] of Object.entries(PLANET_SIGN_MAP)) {
    for (const signNum of signNums) {
      relations.push(mkRel(`planet_${planetNum}`, `sign_${signNum}`, 'EXPRESSED_AS', 1.0));
    }
  }

  // 3. برج → بيت
  for (const [signNum, houseNum] of Object.entries(SIGN_HOUSE_MAP)) {
    relations.push(mkRel(`sign_${signNum}`, `house_${houseNum}`, 'OPERATES_IN', 1.0));
  }

  // 4. جذر → طبع
  for (const [rootNum, elemNum] of Object.entries(ROOT_ELEMENT_MAP)) {
    relations.push(mkRel(`root_${rootNum}`, `element_${elemNum}`, 'HAS_ELEMENT', 1.0));
  }

  // 5. رنين الجذور (توافق + صراع)
  for (const [rootNum, { compatible, conflicts }] of Object.entries(ROOT_RESONANCE)) {
    for (const c of compatible) {
      relations.push(mkRel(`root_${rootNum}`, `root_${c}`, 'RESONATES_WITH', 0.9, { type: 'compatible' }));
    }
    for (const c of conflicts) {
      relations.push(mkRel(`root_${rootNum}`, `root_${c}`, 'CONFLICTS_WITH', 0.9, { type: 'conflict' }));
    }
  }

  // 6. جذر → علاج (Remedy hint)
  for (const [rootNum, hint] of Object.entries(ROOT_REMEDY_HINT)) {
    relations.push(mkRel(`root_${rootNum}`, `root_${rootNum}`, 'HAS_REMEDY_HINT', 1.0, { hint }));
  }

  // 7. علاقات صحية: جذر → جذر طبي بنفس الرقم
  for (let i = 1; i <= 9; i++) {
    relations.push(mkRel(`root_${i}`, `medical_root_${i}`, 'MANIFESTS_AS', 1.0));
  }

  // 8. علاقات صحية: باقي → باقي طبي
  for (let i = 1; i <= 9; i++) {
    relations.push(mkRel(`remainder_${i}`, `medical_remainder_${i}`, 'MANIFESTS_AS', 1.0));
  }

  // 9. حروف → جذور (كل حرف يساهم في جذر معين عبر قيمته)
  // مثال مبسط: ربط كل حرف بالجذر 1-9 حسب القيمة % 9
  const letterRootMap: Record<number, number> = {};
  const letterValues = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000];
  letterValues.forEach((v, idx) => {
    letterRootMap[idx + 1] = (v % 9) === 0 ? 9 : (v % 9);
  });
  for (const [letterNum, rootNum] of Object.entries(letterRootMap)) {
    relations.push(mkRel(`letter_${letterNum}`, `root_${rootNum}`, 'CONTRIBUTES_TO', 0.5));
  }

  console.log(`🔗 تم توليد ${relations.length} علاقة`);
  return relations;
};
