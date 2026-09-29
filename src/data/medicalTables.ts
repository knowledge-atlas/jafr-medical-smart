// ================================================================
// الموسوعة الطبية التكاملية — الجداول التكاملية والمصفوفية والرنين
// البيانات كاملة دون حذف أو تعديل
// ================================================================

// ================================================================
// القسم الثالث: جداول التكامل الخماسي
// ================================================================

export const TABLE_1_ROOT_NEURO_DRUG_ANTIDOTE = [
  { root: 1, neurotransmitter: 'دوبامين', drug: 'منشطات', symbolicAntidote: '2 (الشراكة)', psychologicalAntidote: 'تسليم' },
  { root: 2, neurotransmitter: 'سيروتونين', drug: 'SSRIs', symbolicAntidote: '1 + 4', psychologicalAntidote: 'حدود' },
  { root: 3, neurotransmitter: 'نورإبينفرين', drug: 'SNRIs', symbolicAntidote: '4 + 7', psychologicalAntidote: 'تثبيت' },
  { root: 4, neurotransmitter: 'كورتيزول', drug: 'مثبتات', symbolicAntidote: '3 + 5', psychologicalAntidote: 'مرونة' },
  { root: 5, neurotransmitter: 'أدرينالين', drug: 'حاصرات', symbolicAntidote: '4 + 2', psychologicalAntidote: 'ثبات' },
  { root: 6, neurotransmitter: 'أوكسيتوسين', drug: 'بوسبيرون', symbolicAntidote: '2 + 4', psychologicalAntidote: 'حدود' },
  { root: 7, neurotransmitter: 'ميلاتونين', drug: 'منظمات نوم', symbolicAntidote: '3 + 6', psychologicalAntidote: 'تواصل' },
  { root: 8, neurotransmitter: 'تستوستيرون', drug: 'منشطات', symbolicAntidote: '2 + 6', psychologicalAntidote: 'تسليم' },
  { root: 9, neurotransmitter: 'سيروتونين', drug: 'SSRIs', symbolicAntidote: '1 + 6', psychologicalAntidote: 'تقبل' },
];

export const TABLE_2_REMAINDER_DISORDER_DRUG_ANTIDOTE = [
  { remainder: 1, disorder: 'انفراد مفرط', drug: 'أوكسيتوسين', symbolicAntidote: '2 + 6', psychologicalAntidote: 'شراكة' },
  { remainder: 2, disorder: 'تعلق مفرط', drug: 'SSRI + حدود', symbolicAntidote: '1 + 4', psychologicalAntidote: 'فصل' },
  { remainder: 3, disorder: 'تشتت', drug: 'أتوموكسيتين', symbolicAntidote: '4 + 7', psychologicalAntidote: 'تثبيت' },
  { remainder: 4, disorder: 'جمود', drug: 'SNRIs', symbolicAntidote: '3 + 5', psychologicalAntidote: 'مرونة' },
  { remainder: 5, disorder: 'تقلب', drug: 'مثبتات مزاج', symbolicAntidote: '4 + 2', psychologicalAntidote: 'ثبات' },
  { remainder: 6, disorder: 'إفراط عطاء', drug: 'بوسبيرون', symbolicAntidote: '2 + 4', psychologicalAntidote: 'حدود' },
  { remainder: 7, disorder: 'انغلاق', drug: 'أوكسيتوسين', symbolicAntidote: '3 + 6', psychologicalAntidote: 'تواصل' },
  { remainder: 8, disorder: 'تحكم', drug: 'CBT', symbolicAntidote: '2 + 6', psychologicalAntidote: 'تسليم' },
  { remainder: 9, disorder: 'كمالية', drug: 'SSRI', symbolicAntidote: '1 + 6', psychologicalAntidote: 'تقبل' },
];

export const TABLE_3_ELEMENT_ORGAN_SYSTEM_DRUG = [
  { element: 'مائي', organ: 'الكلى، المثانة', system: 'البولي، الليمفي', drug: 'SSRI، أوكسيتوسين', supplement: 'أوميغا-3، مغنيسيوم' },
  { element: 'ترابي', organ: 'المعدة، الطحال', system: 'الهضمي، العضلي', drug: 'مثبتات، SNRIs', supplement: 'زنك، فيتامين D' },
  { element: 'هوائي', organ: 'الرئة، القولون', system: 'التنفسي، العصبي', drug: 'حاصرات، أتوموكسيتين', supplement: 'مغنيسيوم، B12' },
  { element: 'ناري', organ: 'القلب، الأمعاء', system: 'القلبي، الدموي', drug: 'حاصرات، مثبتات', supplement: 'أوميغا-3، CoQ10' },
];

export const TABLE_4_HOUSE_DOMAIN_DISORDER_DRUG = [
  { house: 1, domain: 'الذات', disorder: 'انفراد', drug: 'أوكسيتوسين', antidote: 'شراكة' },
  { house: 2, domain: 'المال', disorder: 'تعلق مادي', drug: 'SSRI', antidote: 'قناعة' },
  { house: 3, domain: 'التواصل', disorder: 'تشتت', drug: 'أتوموكسيتين', antidote: 'تركيز' },
  { house: 4, domain: 'العائلة', disorder: 'جمود', drug: 'SNRIs', antidote: 'مرونة' },
  { house: 5, domain: 'الإبداع', disorder: 'تقلب', drug: 'مثبتات', antidote: 'ثبات' },
  { house: 6, domain: 'الصحة', disorder: 'وسواس', drug: 'SSRI', antidote: 'تقبل' },
  { house: 7, domain: 'الشراكة', disorder: 'تعلق', drug: 'بوسبيرون', antidote: 'حدود' },
  { house: 8, domain: 'التحول', disorder: 'تحكم', drug: 'CBT', antidote: 'تسليم' },
  { house: 9, domain: 'الفلسفة', disorder: 'كمالية', drug: 'SSRI', antidote: 'تقبل' },
  { house: 10, domain: 'المهنة', disorder: 'فشل', drug: 'منشطات', antidote: 'تسليم' },
  { house: 11, domain: 'الجماعة', disorder: 'عزلة', drug: 'أوكسيتوسين', antidote: 'انتماء' },
  { house: 12, domain: 'اللاوعي', disorder: 'انغلاق', drug: 'أوكسيتوسين', antidote: 'تواصل' },
];

export const TABLE_5_PLANET_GLAND_HORMONE_DRUG = [
  { planet: 'الشمس', gland: 'القلب', hormone: 'أدرينالين', drug: 'منشطات', supplement: 'CoQ10' },
  { planet: 'القمر', gland: 'النخامية', hormone: 'أوكسيتوسين', drug: 'بوسبيرون', supplement: 'أوكسيتوسين' },
  { planet: 'عطارد', gland: 'الدرقية', hormone: 'T3، T4', drug: 'SNRIs', supplement: 'يود' },
  { planet: 'الزهرة', gland: 'الكظرية', hormone: 'كورتيزول', drug: 'مثبتات', supplement: 'مغنيسيوم' },
  { planet: 'المريخ', gland: 'الكظرية', hormone: 'أدرينالين', drug: 'حاصرات', supplement: 'زنك' },
  { planet: 'المشتري', gland: 'الكبد', hormone: 'تستوستيرون', drug: 'منشطات', supplement: 'فيتامين D' },
  { planet: 'زحل', gland: 'الصنوبرية', hormone: 'ميلاتونين', drug: 'منظمات نوم', supplement: 'ميلاتونين' },
  { planet: 'أورانوس', gland: 'النخامية', hormone: 'سيروتونين', drug: 'SSRIs', supplement: '5-HTP' },
  { planet: 'نبتون', gland: 'الصنوبرية', hormone: 'ميلاتونين', drug: 'أوكسيتوسين', supplement: 'أوكسيتوسين' },
  { planet: 'بلوتو', gland: 'الكظرية', hormone: 'كورتيزول', drug: 'مثبتات', supplement: 'أشواغاندا' },
];

// ================================================================
// القسم الرابع: جداول المصفوفة الخماسية
// ================================================================

export const TABLE_6_SYMBOLIC_NEURAL_HORMONAL = [
  { category: 'الجذر 2', neural: 'اللوزة', hormonal: 'كورتيزول', cardiac: 'HRV منخفض', movement: 'توتر منخفض' },
  { category: 'الباقي 2', neural: 'سيروتونين', hormonal: 'أوكسيتوسين', cardiac: 'نبض مرتفع', movement: 'كبت' },
  { category: 'الطبع مائي', neural: 'DMN', hormonal: 'HPA', cardiac: 'مبهم ضعيف', movement: 'تنفس ضعيف' },
  { category: 'البيت 11', neural: 'Salience', hormonal: 'أوكسيتوسين', cardiac: 'ضغط منخفض', movement: 'انسحاب' },
];

export const TABLE_7_DIAGNOSIS_TREATMENT_FOLLOWUP = [
  { dimension: 'رمزي', diagnosis: 'جذر 2، باقي 2', treatment: 'وفق التثبيت', followup: 'شهريًا' },
  { dimension: 'عصبي', diagnosis: 'قلق 17، اكتئاب 18', treatment: 'SSRI + أتوموكسيتين', followup: 'أسبوعيًا' },
  { dimension: 'هرموني', diagnosis: 'كورتيزول مرتفع', treatment: 'مغنيسيوم + أوميغا-3', followup: 'كل 3 أشهر' },
  { dimension: 'قلبي', diagnosis: 'HRV منخفض', treatment: 'Biofeedback + تنفس', followup: 'شهريًا' },
  { dimension: 'حركي', diagnosis: 'توتر منخفض', treatment: 'PMR + مشي', followup: 'أسبوعيًا' },
];

export const TABLE_8_DRUG_DOSE_TIMING_DURATION = [
  { drug: 'سيرترالين', dose: '50-200 mg', timing: 'صباحًا', duration: '6-12 شهرًا', monitoring: 'HRV، ضغط' },
  { drug: 'أتوموكسيتين', dose: '40-80 mg', timing: 'صباحًا', duration: '6-12 شهرًا', monitoring: 'نبض، ضغط' },
  { drug: 'بوسبيرون', dose: '15-60 mg', timing: 'مقسمة', duration: '6-12 شهرًا', monitoring: 'قلق' },
  { drug: 'بروبرانولول', dose: '10-40 mg', timing: 'عند الحاجة', duration: 'حسب الحاجة', monitoring: 'نبض، ضغط' },
  { drug: 'مغنيسيوم', dose: '300 mg', timing: 'ليلًا', duration: 'مستمر', monitoring: 'مغنيسيوم' },
  { drug: 'أوميغا-3', dose: '2 g', timing: 'مع الطعام', duration: 'مستمر', monitoring: 'CRP' },
  { drug: 'فيتامين D', dose: '2000 IU', timing: 'صباحًا', duration: 'مستمر', monitoring: 'فيتامين D' },
];

export const TABLE_9_SYMPTOMS_ROOT_REMAINDER_DRUG = [
  { symptom: 'قلق', root: '2، 5', remainder: '2، 5', drug: 'SSRI، حاصرات' },
  { symptom: 'اكتئاب', root: '2، 7', remainder: '2، 7', drug: 'SSRI، أوكسيتوسين' },
  { symptom: 'تعلق', root: '2، 6', remainder: '2، 6', drug: 'SSRI، بوسبيرون' },
  { symptom: 'تشتت', root: '3، 5', remainder: '3، 5', drug: 'أتوموكسيتين' },
  { symptom: 'جمود', root: '4، 8', remainder: '4، 8', drug: 'SNRIs' },
  { symptom: 'تقلب', root: '5، 8', remainder: '5، 8', drug: 'مثبتات' },
  { symptom: 'كمالية', root: '4، 9', remainder: '4، 9', drug: 'SSRI' },
  { symptom: 'انغلاق', root: '7، 8', remainder: '7، 8', drug: 'أوكسيتوسين' },
];

export const TABLE_10_SUPPLEMENT_DOSE_MECHANISM_WARNING = [
  { supplement: 'مغنيسيوم', dose: '300-400 mg', mechanism: 'تهدئة عصبية', warning: 'إسهال' },
  { supplement: 'أوميغا-3', dose: '2-4 g', mechanism: 'مضاد التهاب', warning: 'سيولة دم' },
  { supplement: 'فيتامين D', dose: '2000-5000 IU', mechanism: 'مناعة', warning: 'فرط كالسيوم' },
  { supplement: '5-HTP', dose: '50-100 mg', mechanism: 'سيروتونين', warning: 'تفاعل SSRI' },
  { supplement: 'L-ثيانين', dose: '200-400 mg', mechanism: 'GABA', warning: 'لا يوجد' },
  { supplement: 'أشواغاندا', dose: '300-600 mg', mechanism: 'كورتيزول', warning: 'غدة درقية' },
  { supplement: 'أوكسيتوسين', dose: '24-40 IU', mechanism: 'تعلق', warning: 'أنفي فقط' },
  { supplement: 'ميلاتونين', dose: '0.5-3 mg', mechanism: 'نوم', warning: 'نعاس' },
];

// ================================================================
// القسم الخامس: جداول الرنين والتفاعلات
// ================================================================

export const TABLE_11_ROOT_RESONANCE = [
  { root: 1, compatible: '3، 5، 9', conflicts: '2، 6، 8', neutral: '4، 7' },
  { root: 2, compatible: '4، 6، 9', conflicts: '1، 5، 8', neutral: '3، 7' },
  { root: 3, compatible: '1، 5، 7', conflicts: '4، 6، 9', neutral: '2، 8' },
  { root: 4, compatible: '2، 6، 8', conflicts: '3، 5، 7', neutral: '1، 9' },
  { root: 5, compatible: '1، 3، 7', conflicts: '2، 4، 8', neutral: '6، 9' },
  { root: 6, compatible: '2، 4، 9', conflicts: '1، 5، 7', neutral: '3، 8' },
  { root: 7, compatible: '3، 5، 9', conflicts: '4، 6، 8', neutral: '1، 2' },
  { root: 8, compatible: '4، 6، 7', conflicts: '1، 2، 5', neutral: '3، 9' },
  { root: 9, compatible: '1، 2، 6', conflicts: '3، 5، 8', neutral: '4، 7' },
];

export const TABLE_12_REMAINDER_RESONANCE = [
  { remainder: 1, compatible: '2، 6', conflicts: '8', neutral: '3، 4، 5، 7، 9' },
  { remainder: 2, compatible: '4، 6، 9', conflicts: '1، 5، 8', neutral: '3، 7' },
  { remainder: 3, compatible: '1، 5، 7', conflicts: '4، 6، 9', neutral: '2، 8' },
  { remainder: 4, compatible: '2، 6، 8', conflicts: '3، 5، 7', neutral: '1، 9' },
  { remainder: 5, compatible: '1، 3، 7', conflicts: '2، 4، 8', neutral: '6، 9' },
  { remainder: 6, compatible: '2، 4، 9', conflicts: '1، 5، 7', neutral: '3، 8' },
  { remainder: 7, compatible: '3، 5، 9', conflicts: '4، 6، 8', neutral: '1، 2' },
  { remainder: 8, compatible: '4، 6، 7', conflicts: '1، 2، 5', neutral: '3، 9' },
  { remainder: 9, compatible: '1، 2، 6', conflicts: '3، 5، 8', neutral: '4، 7' },
];

export const TABLE_13_PLANET_RESONANCE = [
  { planet: 'الشمس', compatible: 'القمر، المريخ', conflicts: 'زحل، نبتون', neutral: 'عطارد، الزهرة' },
  { planet: 'القمر', compatible: 'الشمس، الزهرة', conflicts: 'زحل، بلوتو', neutral: 'عطارد، المريخ' },
  { planet: 'عطارد', compatible: 'الزهرة، أورانوس', conflicts: 'نبتون، بلوتو', neutral: 'الشمس، القمر' },
  { planet: 'الزهرة', compatible: 'القمر، المريخ', conflicts: 'زحل، أورانوس', neutral: 'عطارد، المشتري' },
  { planet: 'المريخ', compatible: 'الشمس، الزهرة', conflicts: 'زحل، نبتون', neutral: 'القمر، المشتري' },
  { planet: 'المشتري', compatible: 'الشمس، القمر', conflicts: 'زحل، بلوتو', neutral: 'المريخ، أورانوس' },
  { planet: 'زحل', compatible: 'عطارد، أورانوس', conflicts: 'الشمس، القمر', neutral: 'الزهرة، المريخ' },
  { planet: 'أورانوس', compatible: 'عطارد، زحل', conflicts: 'الزهرة، نبتون', neutral: 'المشتري، بلوتو' },
  { planet: 'نبتون', compatible: 'القمر، بلوتو', conflicts: 'الشمس، المريخ', neutral: 'عطارد، الزهرة' },
  { planet: 'بلوتو', compatible: 'نبتون، المشتري', conflicts: 'القمر، زحل', neutral: 'أورانوس، عطارد' },
];

// ================================================================
// القسم السابع: جداول إضافية
// ================================================================

export const TABLE_17_SYMPTOM_ROOT_DRUG_ANTIDOTE = [
  { symptom: 'قلق', root: '2، 5', drug: 'SSRI، حاصرات', antidote: '4، 2' },
  { symptom: 'اكتئاب', root: '2، 7', drug: 'SSRI، أوكسيتوسين', antidote: '1، 6' },
  { symptom: 'تعلق', root: '2، 6', drug: 'SSRI، بوسبيرون', antidote: '1، 4' },
  { symptom: 'تشتت', root: '3، 5', drug: 'أتوموكسيتين', antidote: '4، 7' },
  { symptom: 'جمود', root: '4، 8', drug: 'SNRIs', antidote: '3، 5' },
  { symptom: 'تقلب', root: '5، 8', drug: 'مثبتات', antidote: '4، 2' },
  { symptom: 'كمالية', root: '4، 9', drug: 'SSRI', antidote: '1، 6' },
  { symptom: 'انغلاق', root: '7، 8', drug: 'أوكسيتوسين', antidote: '3، 6' },
];

export const TABLE_18_DRUG_MECHANISM_SIDEEFFECTS_MONITORING = [
  { drug: 'سيرترالين', mechanism: '5-HT reuptake', sideEffects: 'غثيان، صداع', monitoring: 'HRV، ضغط' },
  { drug: 'أتوموكسيتين', mechanism: 'NE reuptake', sideEffects: 'غثيان، أرق', monitoring: 'نبض، ضغط' },
  { drug: 'بوسبيرون', mechanism: '5-HT1A agonist', sideEffects: 'دوخة، غثيان', monitoring: 'قلق' },
  { drug: 'بروبرانولول', mechanism: 'β-blocker', sideEffects: 'تباطؤ، تعب', monitoring: 'نبض، ضغط' },
  { drug: 'مغنيسيوم', mechanism: 'NMDA antagonist', sideEffects: 'إسهال', monitoring: 'مغنيسيوم' },
  { drug: 'أوميغا-3', mechanism: 'مضاد التهاب', sideEffects: 'سيولة', monitoring: 'CRP' },
  { drug: 'فيتامين D', mechanism: 'مناعة', sideEffects: 'فرط كالسيوم', monitoring: 'كالسيوم' },
  { drug: 'ميلاتونين', mechanism: 'MT agonist', sideEffects: 'نعاس', monitoring: 'نوم' },
];

export const TABLE_19_PSYCHOTHERAPY_ROOT_GOAL_DURATION = [
  { therapy: 'CBT', root: '2، 4، 9', goal: 'تعديل أفكار', duration: '12-16 أسبوعًا' },
  { therapy: 'DBT', root: '5، 8', goal: 'تنظيم انفعال', duration: '6-12 شهرًا' },
  { therapy: 'EFT', root: '2، 6', goal: 'تعلق', duration: '8-12 أسبوعًا' },
  { therapy: 'علاج وجودي', root: '7، 9', goal: 'معنى', duration: '12-24 أسبوعًا' },
  { therapy: 'علاج جماعي', root: '1، 7', goal: 'تواصل', duration: '12-20 أسبوعًا' },
  { therapy: 'علاج عائلي', root: '6، 2', goal: 'علاقات', duration: '12-24 أسبوعًا' },
  { therapy: 'تأمل', root: '7، 9', goal: 'وعي', duration: 'مستمر' },
  { therapy: 'يوغا', root: '2، 6', goal: 'توازن', duration: 'مستمر' },
];

export const TABLE_20_FINAL_SUMMARY = [
  { root: 1, symbol: 'السيادة', neurotransmitter: 'دوبامين', gland: 'الكظرية', organ: 'القشرة', drug: 'منشطات', antidote: '2' },
  { root: 2, symbol: 'الثنائية', neurotransmitter: 'سيروتونين', gland: 'النخامية', organ: 'اللوزة', drug: 'SSRIs', antidote: '1 + 4' },
  { root: 3, symbol: 'الامتداد', neurotransmitter: 'نورإبينفرين', gland: 'الدرقية', organ: 'المخيخ', drug: 'SNRIs', antidote: '4 + 7' },
  { root: 4, symbol: 'القاعدة', neurotransmitter: 'كورتيزول', gland: 'الكظرية', organ: 'الحصين', drug: 'مثبتات', antidote: '3 + 5' },
  { root: 5, symbol: 'الحركة', neurotransmitter: 'أدرينالين', gland: 'الكظرية', organ: 'الرئة', drug: 'حاصرات', antidote: '4 + 2' },
  { root: 6, symbol: 'الحب', neurotransmitter: 'أوكسيتوسين', gland: 'النخامية', organ: 'القلب', drug: 'بوسبيرون', antidote: '2 + 4' },
  { root: 7, symbol: 'السر', neurotransmitter: 'ميلاتونين', gland: 'الصنوبرية', organ: 'المناعة', drug: 'منظمات نوم', antidote: '3 + 6' },
  { root: 8, symbol: 'القوة', neurotransmitter: 'تستوستيرون', gland: 'الخصية', organ: 'الكبد', drug: 'منشطات', antidote: '2 + 6' },
  { root: 9, symbol: 'الكمال', neurotransmitter: 'سيروتونين', gland: 'النخامية', organ: 'CNS', drug: 'SSRIs', antidote: '1 + 6' },
];
