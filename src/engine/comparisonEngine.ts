// ================================================================
// محرك المقارنة الحقيقي بين اسمين
// ================================================================

import { buildReport } from './reportBuilder';
import jafrResonance from '../data/jafr_resonance.json';
import elementResonanceData from '../data/elementResonance.json';

export interface ComparisonResult {
  // بيانات أساسية
  name1: string;
  name2: string;
  root1: number;
  root2: number;
  total1: number;
  total2: number;
  planet1: string;
  planet2: string;
  sign1: string;
  sign2: string;
  element1: string;
  element2: string;
  house1: number;
  house2: number;
  houseName1: string;
  houseName2: string;

  // الأقسام
  rootResonance: any | null;
  elementResonance: any;
  planetAnalysis: any;
  signAnalysis: any;
  houseAnalysis: any;

  // مؤشرات
  overallScore: number;
  verdict: string;
  verdictColor: string;

  // قوائم
  strengths: string[];
  challenges: string[];
  recommendations: string[];
}

// تحويل الطبع العربي إلى مفتاح
const elementKeyMap: Record<string, string> = {
  'ناري': 'fire',
  'ترابي': 'earth',
  'هوائي': 'air',
  'مائي': 'water',
  'نار': 'fire',
  'تراب': 'earth',
  'هواء': 'air',
  'ماء': 'water',
};

// تحويل رقم الكوكب إلى اسمه
const planetNumber: Record<string, number> = {
  'شمس': 1, 'الشمس': 1, 'قمر': 2, 'القمر': 2, 'عطارد': 3,
  'زهرة': 4, 'الزهرة': 4, 'مريخ': 5, 'المريخ': 5,
  'مشتري': 6, 'المشتري': 6, 'زحل': 7, 'أورانوس': 8,
  'نبتون': 9, 'بلوتو': 10,
};

export function compareNames(name1: string, name2: string): ComparisonResult | { error: string } {
  const r1: any = buildReport(name1);
  const r2: any = buildReport(name2);
  if (r1.error || r2.error) {
    return { error: 'فشل تحليل أحد الأسماء — تأكد من كتابته بالعربية' };
  }

  const root1 = r1.root;
  const root2 = r2.root;
  const element1 = r1.internalElement || 'مائي';
  const element2 = r2.internalElement || 'مائي';
  const planet1 = r1.internalPlanet || '';
  const planet2 = r2.internalPlanet || '';
  const sign1 = r1.internalSign || '';
  const sign2 = r2.internalSign || '';
  const house1 = r1.internalHouse || 1;
  const house2 = r2.internalHouse || 1;
  const houseName1 = r1.calculation?.internal?.houseName || `البيت ${house1}`;
  const houseName2 = r2.calculation?.internal?.houseName || `البيت ${house2}`;

  // ═══════════════════════════════════════════════════════════
  // 1. رنين الجذرين
  // ═══════════════════════════════════════════════════════════
  const rootKey = `${root1}+${root2}`;
  const reverseRootKey = `${root2}+${root1}`;
  const rootMap = (jafrResonance as any).rootResonance || {};
  const rootResonance = rootMap[rootKey] || rootMap[reverseRootKey] || null;

  // ═══════════════════════════════════════════════════════════
  // 2. رنين الطبائع
  // ═══════════════════════════════════════════════════════════
  const ek1 = elementKeyMap[element1] || 'water';
  const ek2 = elementKeyMap[element2] || 'water';
  const elKey = [ek1, ek2].sort().join('_');
  const elRes = (elementResonanceData as any).resonance[elKey] || null;

  // ═══════════════════════════════════════════════════════════
  // 3. تحليل الكوكبين
  // ═══════════════════════════════════════════════════════════
  const samePlanet = planet1 === planet2;
  const p1Num = planetNumber[planet1] || 0;
  const p2Num = planetNumber[planet2] || 0;
  const planetDiff = Math.abs(p1Num - p2Num);
  const planetAnalysis = {
    same: samePlanet,
    same_planet: samePlanet ? planet1 : null,
    close_planets: planetDiff === 1 && !samePlanet,
    far_planets: planetDiff >= 5,
    insight: samePlanet
      ? `كلاهما متحرك بكوكب ${planet1} — نفس الدافع الأساسي، تفاهم فوري لكن قد يتنافسان على نفس الميدان.`
      : `كوكب ${name1} هو ${planet1} (دافعه: ${getPlanetDrive(planet1)})، وكوكب ${name2} هو ${planet2} (دافعه: ${getPlanetDrive(planet2)}).`,
  };

  // ═══════════════════════════════════════════════════════════
  // 4. تحليل البرجين
  // ═══════════════════════════════════════════════════════════
  const sameSign = sign1 === sign2;
  const signAnalysis = {
    same: sameSign,
    same_sign: sameSign ? sign1 : null,
    insight: sameSign
      ? `كلاهما يتحدث بأسلوب ${sign1} — لغة مشتركة، لكن احتكاك على نفس النمط.`
      : `${name1} يتحدث بلغة ${sign1}، و${name2} يتحدث بلغة ${sign2}.`,
  };

  // ═══════════════════════════════════════════════════════════
  // 5. تحليل البيتين
  // ═══════════════════════════════════════════════════════════
  const sameHouse = house1 === house2;
  const houseAnalysis = {
    same: sameHouse,
    same_house: sameHouse ? `${house1} — ${houseName1}` : null,
    insight: sameHouse
      ? `مجالهما واحد (${houseName1}) — يتنافسان على نفس المسرح، احتكاك مضمون لكن فهم متبادل.`
      : `${name1} يعمل في ${houseName1}، و${name2} يعمل في ${houseName2}.`,
  };

  // ═══════════════════════════════════════════════════════════
  // 6. حساب النتيجة الإجمالية (Weighted)
  // ═══════════════════════════════════════════════════════════
  // الأوزان: طبائع 40%, جذور 35%, توافق كوكبي 15%, مسرح حياة 10%
  const elementScore = elRes?.score || 50;

  // درجة رنين الجذور من description/shadows — تحويل نصي إلى رقم
  let rootScore = 60; // افتراضي
  if (rootResonance) {
    const desc = rootResonance.description || '';
    if (desc.includes('متناغم') || desc.includes('تضاعف') || desc.includes('تناغم')) rootScore = 85;
    else if (desc.includes('صراع') || desc.includes('تعارض')) rootScore = 40;
    else if (desc.includes('موزون') || desc.includes('توافق')) rootScore = 80;
    else if (desc.includes('تضخيم') || desc.includes('تحدٍ')) rootScore = 55;
    else rootScore = 65;
  }

  // توافق الكوكبين
  let planetScore = 70;
  if (samePlanet) planetScore = 75;
  else if (planetDiff <= 2) planetScore = 80;
  else if (planetDiff >= 5) planetScore = 50;

  // توافق مسرح الحياة
  let houseScore = 70;
  if (sameHouse) houseScore = 65; // احتكاك
  else houseScore = 75; // تكامل

  const overallScore = Math.round(
    elementScore * 0.40 + rootScore * 0.35 + planetScore * 0.15 + houseScore * 0.10
  );

  // التقييم
  let verdict = '';
  let verdictColor = '';
  if (overallScore >= 85) {
    verdict = '🌟 تناغم استثنائي — علاقة ذهبية';
    verdictColor = '#27ae60';
  } else if (overallScore >= 70) {
    verdict = '✅ توافق عالٍ — علاقة مثمرة';
    verdictColor = '#1abc9c';
  } else if (overallScore >= 55) {
    verdict = '⚖️ توافق متوسط — يحتاج وعي وجهد';
    verdictColor = '#f39c12';
  } else if (overallScore >= 40) {
    verdict = '⚠️ توتر عالٍ — علاقة تحدٍ وتعلم';
    verdictColor = '#e67e22';
  } else {
    verdict = '❌ تناقض حاد — علاقة استنزاف';
    verdictColor = '#e74c3c';
  }

  // ═══════════════════════════════════════════════════════════
  // 7. استخراج القوى والتحديات والتوصيات
  // ═══════════════════════════════════════════════════════════
  const strengths: string[] = [];
  const challenges: string[] = [];
  const recommendations: string[] = [];

  // من رنين الجذور
  if (rootResonance) {
    if (rootResonance.description) strengths.push(`🔷 رنين الجذور: ${rootResonance.description}`);
    if (rootResonance.shadow) challenges.push(`🌑 الظل المحتمل: ${rootResonance.shadow}`);
    if (rootResonance.remedy) recommendations.push(`💊 الترياق الجذري: ${rootResonance.remedy}`);
  }

  // من رنين الطبائع
  if (elRes) {
    if (elRes.result) strengths.push(`🔥 رنين الطبائع: ${elRes.result}`);
    if (elRes.advice) recommendations.push(`📌 توصية الطبائع: ${elRes.advice}`);
  }

  // من الكوكب
  if (planetAnalysis.insight) strengths.push(`☀️ ${planetAnalysis.insight}`);

  // من البيت
  if (houseAnalysis.insight) {
    if (sameHouse) challenges.push(`🏠 ${houseAnalysis.insight}`);
    else strengths.push(`🏠 ${houseAnalysis.insight}`);
  }

  // توصيات إضافية مبنية على النتيجة
  if (overallScore >= 85) {
    recommendations.push('💡 استثمرا في هذا الارتباط: تعاون طويل المدى يثمر.');
    recommendations.push('💡 لا تأخذا التناغم كأمر مسلّم — استمرا في الحوار.');
  } else if (overallScore >= 70) {
    recommendations.push('💡 حدّدا أدواراً واضحة لكل طرف حسب نقطة قوته.');
    recommendations.push('💡 اجعلا مساحة للفردية بجانب الشراكة.');
  } else if (overallScore >= 55) {
    recommendations.push('💡 وضع حدود صريحة قبل أي التزام طويل.');
    recommendations.push('💡 اتفاق على "مساحة للتنفس" يمنع الاحتكاك.');
  } else {
    recommendations.push('💡 فكّرا في مسافات فاصلة — التواصل المُتحكّم أفضل من اليومي.');
    recommendations.push('💡 تجنّبا المشاريع المشتركة الكبيرة دون طرف ثالث محايد.');
  }

  // توصية عن الطبائع
  if (elementScore < 50) {
    recommendations.push('⚠️ التوتر الطبائعي عالٍ — يحتاج جهداً واعياً يومياً.');
  } else if (elementScore >= 90) {
    recommendations.push('🌟 الطبائع متناغمة — سهولة في التواصل العاطفي.');
  }

  return {
    name1,
    name2,
    root1, root2,
    total1: r1.calculation?.total || 0,
    total2: r2.calculation?.total || 0,
    planet1, planet2,
    sign1, sign2,
    element1, element2,
    house1, house2,
    houseName1, houseName2,
    rootResonance,
    elementResonance: elRes,
    planetAnalysis,
    signAnalysis,
    houseAnalysis,
    overallScore,
    verdict,
    verdictColor,
    strengths,
    challenges,
    recommendations,
  };
}

function getPlanetDrive(planet: string): string {
  const drives: Record<string, string> = {
    'شمس': 'الهوية والظهور',
    'قمر': 'الاحتواء والمشاعر',
    'عطارد': 'العقل والتواصل',
    'زهرة': 'الجمال والعلاقة',
    'مريخ': 'الفعل والاختراق',
    'مشتري': 'التوسع والمعنى',
    'زحل': 'البناء والانضباط',
    'أورانوس': 'التغيير والثورة',
    'نبتون': 'الخيال والحدس',
    'بلوتو': 'التحول الجذري',
  };
  return drives[planet] || planet;
}
